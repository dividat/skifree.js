{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem
      (system:
        let pkgs = nixpkgs.legacyPackages.${system};
        in { devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodePackages.typescript
            python3
            esbuild
            watchexec

            # Adjust sprites
            pngquant
            imagemagick
          ];
        }; }
      );
}
