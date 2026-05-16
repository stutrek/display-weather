import type { HomeAssistant } from 'preact-homeassistant';

export interface CreateMockHassOptions {
  entities?: Record<string, any>;
}

/**
 * Build a minimal HomeAssistant-shaped object for tests and storybook.
 * Pass in the entities your component needs; the rest is stubbed.
 */
export function createMockHass({ entities = {} }: CreateMockHassOptions = {}): HomeAssistant {
  return {
    states: entities,
    config: {} as any,
    services: {} as any,
    connection: {
      sendMessagePromise: async () => ({}),
    } as any,
    callService: async () => {},
  };
}

/**
 * No-op `subscribeToEntity` for tests/stories that don't need entity change
 * notifications. Pass directly (not invoked): `subscribeToEntity={noopSubscribe}`.
 */
export const noopSubscribe = (
  _entityId: string,
  _callback: (entity: any) => void,
): (() => void) => {
  return () => {};
};

/**
 * Build a `subscribeToEntity` that captures listeners so tests can fire entity
 * updates manually via the returned `notify` helper.
 */
export function createMockSubscribe() {
  const listeners = new Map<string, Set<(entity: any) => void>>();

  const subscribe = (entityId: string, callback: (entity: any) => void) => {
    if (!listeners.has(entityId)) {
      listeners.set(entityId, new Set());
    }
    listeners.get(entityId)!.add(callback);
    return () => {
      listeners.get(entityId)?.delete(callback);
    };
  };

  const notify = (entityId: string, entity: any) => {
    listeners.get(entityId)?.forEach((cb) => cb(entity));
  };

  return { subscribe, notify, listeners };
}
