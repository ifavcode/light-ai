import { Module } from "@nestjs/common";
import { sshClientProviders } from "./ssh-client.providers";

@Module({
  providers: [...sshClientProviders],
  exports: [...sshClientProviders],
})
export class SshClientModule {}
