import {
  InstanceLeaseGuard,
  InstanceLeaseGuardError,
  type InstanceLeaseLauncherEvidence,
  type VerifiedInstanceLeaseHandle,
} from '@features/instance-lease';
import {
  createInstanceLeaseChildStdioPolicy,
  NodeInheritedInstanceLeaseError,
} from '@features/instance-lease/main';
import { describe, expect, it, vi } from 'vitest';

const evidence = (): InstanceLeaseLauncherEvidence => ({
  protocolVersion: 1,
  launcherPid: 100,
  controllerPid: 101,
  anchor: {
    device: '8',
    inode: '42',
    mode: 0o100644,
    uid: 0,
    linkCount: 1,
  },
});

const handle = (leaseEvidence = evidence()): VerifiedInstanceLeaseHandle => ({
  evidence: leaseEvidence,
  assertValid: vi.fn(),
  close: vi.fn(),
});

describe('InstanceLeaseGuard', () => {
  it('validates before admission and revalidates each held assertion', () => {
    const verifiedHandle = handle();
    const guard = InstanceLeaseGuard.takeOwnership(verifiedHandle);

    expect(guard.state).toBe('held');
    expect(guard.assertHeld()).toEqual(evidence());
    expect(verifiedHandle.assertValid).toHaveBeenCalledTimes(2);
  });

  it('keeps an immutable evidence snapshot instead of trusting later mutations', () => {
    const mutableEvidence = evidence() as {
      protocolVersion: 1;
      launcherPid: number;
      controllerPid: number;
      anchor: {
        device: string;
        inode: string;
        mode: number;
        uid: number;
        linkCount: number;
      };
    };
    const verifiedHandle = handle(mutableEvidence);
    const guard = InstanceLeaseGuard.takeOwnership(verifiedHandle);

    mutableEvidence.anchor.inode = '9000';

    expect(guard.evidence.anchor.inode).toBe('42');
    expect(Object.isFrozen(guard.evidence)).toBe(true);
    expect(Object.isFrozen(guard.evidence.anchor)).toBe(true);
  });

  it('fails closed when initial adapter validation fails', () => {
    const verifiedHandle = handle();
    vi.mocked(verifiedHandle.assertValid).mockImplementation(() => {
      throw new Error('descriptor invalid');
    });

    expect(() => InstanceLeaseGuard.takeOwnership(verifiedHandle)).toThrowError(
      new InstanceLeaseGuardError('invalid_handle')
    );
    expect(verifiedHandle.close).not.toHaveBeenCalled();
  });

  it('rejects malformed evidence even when an adapter claims it is valid', () => {
    const invalidEvidence = evidence() as {
      protocolVersion: 1;
      launcherPid: number;
      controllerPid: number;
      anchor: {
        device: string;
        inode: string;
        mode: number;
        uid: number;
        linkCount: number;
      };
    };
    invalidEvidence.anchor.uid = 1000;

    expect(() => InstanceLeaseGuard.takeOwnership(handle(invalidEvidence))).toThrowError(
      new InstanceLeaseGuardError('invalid_handle')
    );
  });

  it('has one terminal idempotent release and no reacquire transition', () => {
    const verifiedHandle = handle();
    const guard = InstanceLeaseGuard.takeOwnership(verifiedHandle);

    guard.release();
    guard.release();

    expect(guard.state).toBe('released');
    expect(verifiedHandle.close).toHaveBeenCalledTimes(1);
    expect(() => guard.assertHeld()).toThrowError(new InstanceLeaseGuardError('released'));
  });
});

describe('Node instance lease child descriptor policy', () => {
  it.skipIf(process.platform !== 'linux')(
    'forces both protocol slots away from inherited lease descriptors',
    () => {
      const policy = createInstanceLeaseChildStdioPolicy(['ignore', 'pipe', 'inherit']);
      const stdio = policy.stdio as unknown[];

      expect(Object.isFrozen(stdio)).toBe(true);
      expect(typeof stdio[3]).toBe('number');
      expect(stdio[3]).toBe(stdio[4]);
      expect(stdio[3]).not.toBe(3);
      expect(stdio[3]).not.toBe(4);

      policy.close();
      policy.close();
    }
  );

  it.skipIf(process.platform !== 'linux')(
    'rejects caller mappings that could copy or occupy a protocol slot',
    () => {
      expect(() => createInstanceLeaseChildStdioPolicy(['ignore', 3, 'ignore'])).toThrowError(
        new NodeInheritedInstanceLeaseError('child_stdio_invalid')
      );
      expect(() =>
        createInstanceLeaseChildStdioPolicy(['ignore', 'ignore', 'ignore', 'ipc'])
      ).toThrowError(new NodeInheritedInstanceLeaseError('child_stdio_invalid'));
    }
  );
});
