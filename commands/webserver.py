"""
Copyright 2018 Duo Security

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote
products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
"""
import argparse
import os
import posixpath
import socket
from six.moves import urllib
from six.moves.BaseHTTPServer import HTTPServer
from six.moves.SimpleHTTPServer import SimpleHTTPRequestHandler

__description__ = "Run a webserver to display network or web of trust map"


class RootedHTTPServer(HTTPServer):
    def __init__(self, base_path, *args, **kwargs):
        HTTPServer.__init__(self, *args, **kwargs)
        self.RequestHandlerClass.base_path = base_path


class RootedHTTPServerV6(RootedHTTPServer, object):
    address_family = socket.AF_INET6

    def __init__(self, *args, **kwargs):
        super(RootedHTTPServerV6, self).__init__(*args, **kwargs)


class MyHTTPRequestHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        path = posixpath.normpath(urllib.parse.unquote(path))
        words = path.split("/")
        words = [_f for _f in words if _f]
        path = self.base_path
        for word in words:
            _, word = os.path.splitdrive(word)
            _, word = os.path.split(word)
            if word in (os.curdir, os.pardir):
                continue
            if "?" in word:
                word = word[0 : word.index("?")]
            path = os.path.join(path, word)
        return path

    def end_headers(self):
        self.send_my_headers()
        SimpleHTTPRequestHandler.end_headers(self)

    def send_my_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")


def run(arguments):
    parser = argparse.ArgumentParser(
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    parser.add_argument("--port", help="Port to listen on", default=8000, type=int)
    parser.add_argument(
        "--public",
        dest="is_public",
        help="Allow connections from 0.0.0.0 (or :: if --ipv6 was provided) as opposed to only localhost",
        action="store_true",
    )
    parser.add_argument(
        "--ipv6", dest="is_ipv6", help="Listen on IPv6", action="store_true"
    )
    parser.set_defaults(is_public=False, is_ipv6=False)
    args = parser.parse_args(arguments)

    if args.is_public:
        listening_host = "::" if args.is_ipv6 else "0.0.0.0"
    else:
        listening_host = "::1" if args.is_ipv6 else "127.0.0.1"

    Handler = MyHTTPRequestHandler
    Handler.extensions_map[".svg"] = "image/svg+xml"

    if args.is_ipv6:
        httpd = RootedHTTPServerV6("web", (listening_host, args.port), Handler)
    else:
        httpd = RootedHTTPServer("web", (listening_host, args.port), Handler)
    print(
        "CloudMapper serving web directory on {}:{}".format(listening_host, args.port)
    )
    httpd.serve_forever()
