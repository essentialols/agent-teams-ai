import { TeamProvisioningService } from '@main/services/team/TeamProvisioningService';
import { describe, expect, it } from 'vitest';

type MemberLifecycleHostProbe = {
  memberLifecycleHost: {
    readConfigForStrictDecision(teamName: string): Promise<unknown>;
    mcpConfigBuilder: {
      writeConfigFile(projectPath?: string): Promise<string>;
    };
    membersMetaStore: {
      getMembers(teamName: string): Promise<unknown[]>;
    };
    teamMetaStore: {
      getMeta(teamName: string): Promise<unknown>;
    };
  };
};

describe('TeamProvisioningService member lifecycle host', () => {
  it('binds member lifecycle host callbacks to the service receiver', async () => {
    const configReader = {
      marker: 'reader-bound',
      async getConfig(this: { marker: string }, teamName: string) {
        return {
          name: `${this.marker}:${teamName}`,
          members: [],
        };
      },
    };
    const mcpConfigBuilder = {
      marker: 'mcp-bound',
      async writeConfigFile(this: { marker: string }, projectPath?: string) {
        return `${projectPath ?? ''}/${this.marker}.json`;
      },
    };
    const membersMetaStore = {
      marker: 'members-bound',
      async getMembers(this: { marker: string }, teamName: string) {
        return [{ name: `${this.marker}:${teamName}` }];
      },
    };
    const teamMetaStore = {
      marker: 'team-meta-bound',
      async getMeta(this: { marker: string }, teamName: string) {
        return { cwd: `/${this.marker}/${teamName}` };
      },
    };
    const service = new TeamProvisioningService(
      configReader as unknown as ConstructorParameters<typeof TeamProvisioningService>[0],
      undefined,
      membersMetaStore as unknown as ConstructorParameters<typeof TeamProvisioningService>[2],
      undefined,
      mcpConfigBuilder as unknown as ConstructorParameters<typeof TeamProvisioningService>[4],
      teamMetaStore as unknown as ConstructorParameters<typeof TeamProvisioningService>[5]
    );
    const host = (service as unknown as MemberLifecycleHostProbe).memberLifecycleHost;

    await expect(host.readConfigForStrictDecision('alpha')).resolves.toMatchObject({
      name: 'reader-bound:alpha',
    });
    await expect(host.mcpConfigBuilder.writeConfigFile('/repo')).resolves.toBe(
      '/repo/mcp-bound.json'
    );
    await expect(host.membersMetaStore.getMembers('alpha')).resolves.toEqual([
      { name: 'members-bound:alpha' },
    ]);
    await expect(host.teamMetaStore.getMeta('alpha')).resolves.toMatchObject({
      cwd: '/team-meta-bound/alpha',
    });
  });
});
