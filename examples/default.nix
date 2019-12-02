{
  pkgs ? import (fetchTarball {
    url = https://releases.nixos.org/nixos/19.03/nixos-19.03.172883.1601f559e89/nixexprs.tar.xz;
    sha256 = "0gvjqr5ra8l1qrgn98cr9y9a5icj0njclw0ks3nd8yg0b4ja2q63";
  }) {}
}:
  with pkgs;
  stdenv.mkDerivation rec {
    name = "bot-${version}";
    version = "0.0.1";
    src = ./.;
    phases = [ "unpackPhase" "buildPhase" "installPhase" ];
    buildInputs = [ nodejs-11_x ];
    buildPhase = ''
      export HOME="."
      cd ..
      npm i
    '';
    installPhase = ''
      mkdir -p $out/
      cp -r . $out/
      cp -r * $out/
    '';
  }
