let
  region = "ap-northeast-1";
  accessKeyId = "default"; # symbolic name looked up in ~/.ec2-keys or a ~/.aws/credentials profile name
  shell     = import ./default.nix {};
in
  {
    git =
      { config, pkgs, resources, ... }:
      { deployment.targetEnv = "ec2";
      deployment.ec2.accessKeyId = accessKeyId;
      deployment.ec2.region = region;
      deployment.ec2.instanceType = "t2.micro";
      deployment.ec2.keyPair = "nixops";
      deployment.ec2.securityGroups = [
        "default"
        resources.ec2SecurityGroups.ssh-all
      ];
      deployment.ec2.ebsInitialRootDiskSize = 8;
      deployment.owners = [ "martijn@becker.work" ];
      services.openssh.enable = true;

      users.mutableUsers = false;
      users.users.worker = {
        isNormalUser = false;
        createHome = true;
        home = "/home/worker";
        packages = with pkgs; [
          nodejs-11_x
        ];
      };
      systemd.services.bot = {
        wantedBy = [ "multi-user.target" ];
        serviceConfig = {
          Type = "forking";
          Restart = "always";
          ExecStart = "${pkgs.nodejs-11_x}/bin/node ${shell}/examples/shell.js test";
          User = "worker";
          WorkingDirectory = "/home/worker";
        };
      };
      users.users.root.openssh.authorizedKeys.keys = [
        "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCuhdlo0rIskjhJSOC0wAyVgX7CRz0nQx+wuPPCvKcTT75rnUDeFrTPjDo/VP9dBFc/kpQc+CJsDKag1JnR4GLzATyht1+d6BG+TW73FyxFg8ThbEMlGxKK2BvM9W3yUmoESLEoTrhgPgl/PizFW2LuF8SEVUXIoF8xnV51oBhrmaCpleOihL1orVlBTFAMQO9vmuWl/ai/qX1o3aFuC7nPPsyujuZDZ3sOyuWaUFkbjkEDdgURY67E7AuP/nIswQfe+usNPPx3uWZBw9qXPH+tg8MmsFNfmtZUue2oBWrCXcKorWybBt3A9BezSy7Wms6QIrdGJM7oop7yznWwQmwT"
      ];
    };
    resources.ec2SecurityGroups.ssh-all = {
      accessKeyId = accessKeyId;
      region = region;
      rules = [ {
        fromPort = 22;
        toPort = 22;
        sourceIp = "0.0.0.0/0";
      } ];
    };
  }
