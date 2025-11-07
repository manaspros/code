/**
 * Type declarations for @composio/core
 * MVP: Basic types to make TypeScript happy
 */

declare module "@composio/core" {
  export class Composio {
    constructor(config: { apiKey: string });
    entities: {
      list(): Promise<{ items: any[] }>;
      create(params: { id: string }): Promise<any>;
    };
    connectedAccounts: {
      list(params: { entityIds: string[] }): Promise<{ items: any[] }>;
    };
    tools: {
      execute(
        toolName: string,
        params: {
          connectedAccountId: string;
          arguments: Record<string, any>;
        }
      ): Promise<{
        successfull: boolean;
        data: any;
        error: string | null;
      }>;
    };
    actions: {
      list(params: { apps: string }): Promise<{ items: any[] }>;
    };
  }
}
