{ pkgs, python, packages, ... }:

pkgs.python3Packages.buildPythonPackage rec {
  pname = "cloudmapper";
  version = "2.10.0";
  src = ./.;

  propagatedBuildInputs = packages;

  postInstall = ''
    cp $out/bin/cloudmapper.py $out/bin/cloudmapper
  '';

}
