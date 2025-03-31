(self0: super0:
        let
          myOverride = {
            packageOverrides = self: super: {

              "parliament" = super.buildPythonPackage rec {
                pname = "parliament";
                version = "1.5.2";
                src = super0.fetchurl {
                  url =
                    "https://files.pythonhosted.org/packages/ab/a8/47e63d872a4cbe4d48fb6d2df08ebf87c7feb1b8349030b180a0782299eb/parliament-1.5.2-py3-none-any.whl";
                  sha256 =
                    "1d8j51429df7j1abqsgakwidcq4w4yn0aisfs6vdsnxqz5744l0r";
                };
                format = "wheel";
                doCheck = false;
                buildInputs = [ ];
                checkInputs = [ ];
                nativeBuildInputs = [ ];
                propagatedBuildInputs = [
                  super.pyyaml
                  super.boto3
                  super.jmespath
                  self."json-cfg"
                  self.setuptools
                ];
              };

              "json-cfg" = super.buildPythonPackage rec {
                pname = "json-cfg";
                version = "0.4.2";
                src = super0.fetchurl {
                  url =
                    "https://files.pythonhosted.org/packages/b7/f5/ecdfc00830bcbaf7743f0237cf4f3ced5511d57257408db01aa320e09458/json_cfg-0.4.2-py2.py3-none-any.whl";
                  sha256 =
                    "1j0nnx48srkhvs7ibb6r1jwzvgvj268cqq07cpxbscvigaix1j3h";
                };
                format = "wheel";
                doCheck = false;
                buildInputs = [ ];
                checkInputs = [ ];
                nativeBuildInputs = [ ];
                propagatedBuildInputs = [ self."kwonly-args" ];
              };

              "kwonly-args" = super.buildPythonPackage rec {
                pname = "kwonly-args";
                version = "1.0.10";
                src = super0.fetchurl {
                  url =
                    "https://files.pythonhosted.org/packages/00/37/3251dc1c11f5e9c4b8fb1b3f433da4b55ec52e3fe5c14b13a2a558990260/kwonly_args-1.0.10-py2.py3-none-any.whl";
                  sha256 =
                    "1jz1f977lfd639my2xqjd9yndgkg0hxhb8rdlwzw0g8i077nrkiy";
                };
                format = "wheel";
                doCheck = false;
                buildInputs = [ ];
                checkInputs = [ ];
                nativeBuildInputs = [ ];
                propagatedBuildInputs = [ ];
              };

              pyjq = super.buildPythonPackage rec {
                pname = "pyjq";
                version = "2.6.0";
                src = super.fetchPypi {
                  inherit pname version;
                  sha256 =
                    "e083f326f4af8b07b8ca6424d1f99afbdd7db9b727284da5f919b9816077f2e4";
                };
                format = "setuptools";
                doCheck = false;
                buildInputs = [ ];
                checkInputs = [ ];
                nativeBuildInputs = [
                  super0.libtool
                  super0.automake
                  super0.autoconf
                  super0.pkg-config
                ];
                propagatedBuildInputs = [ ];
              };

            };
          };
        in {
          # Add an override for each required python version.
          # There’s currently no way to add a package that’s automatically picked up by
          # all python versions, besides editing python-packages.nix
          python3 = super0.python3.override myOverride;
          python311 = super0.python311.override myOverride;
        })
