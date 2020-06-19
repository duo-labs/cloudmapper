#!/usr/bin/env python3
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
---------------------------------------------------------------------------

This script manages CloudMapper, a tool for analyzing AWS environments.
"""
from __future__ import absolute_import, division, print_function
import sys
import pkgutil
import importlib

__version__ = "2.9.1"


def show_help(commands):
    print("CloudMapper {}".format(__version__))
    print("usage: {} [{}] [...]".format(sys.argv[0], "|".join(sorted(commands.keys()))))
    for command, module in sorted(commands.items()):
        print("  {}: {}".format(command, module.__description__))
    exit(-1)


def main():
    """Entry point for the CLI."""

    # Load commands
    # TODO: This adds half a second to the start time. Is there a smarter way
    # to do this?
    commands = {}
    commands_paths = ["commands", "private_commands"]
    for commands_path in commands_paths:
        for importer, command_name, _ in pkgutil.iter_modules([commands_path]):
            full_package_name = "%s.%s" % (commands_path, command_name)
            module = importlib.import_module(full_package_name)
            commands[command_name] = module

    # Parse command
    if len(sys.argv) <= 1:
        show_help(commands)

    command = sys.argv[1]
    arguments = sys.argv[2:]

    if command in commands:
        commands[command].run(arguments)
    else:
        show_help(commands)


if __name__ == "__main__":
    main()
