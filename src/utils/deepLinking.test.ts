import { parseDeepLink } from './deepLinking';

describe('parseDeepLink', () => {
  it('parses a community detail link', () => {
    expect(parseDeepLink('homeownershub://community/c1')).toEqual({
      type: 'community',
      communityId: 'c1',
    });
  });

  it('parses a community chat link', () => {
    expect(parseDeepLink('homeownershub://community/c1/chat')).toEqual({
      type: 'chat',
      communityId: 'c1',
    });
  });

  it('parses a community announcements link', () => {
    expect(parseDeepLink('homeownershub://community/c1/announcements')).toEqual({
      type: 'announcements',
      communityId: 'c1',
    });
  });

  it('parses a join link', () => {
    expect(parseDeepLink('homeownershub://join/ABC123')).toEqual({
      type: 'join',
      code: 'ABC123',
    });
  });

  it('tolerates a trailing slash', () => {
    expect(parseDeepLink('homeownershub://community/c1/')).toEqual({
      type: 'community',
      communityId: 'c1',
    });
  });

  it('returns null for an unknown sub-path', () => {
    expect(parseDeepLink('homeownershub://community/c1/settings')).toBeNull();
  });

  it('returns null for an unrelated scheme/path', () => {
    expect(parseDeepLink('homeownershub://something-else')).toBeNull();
  });

  it('returns null for a community link missing an id', () => {
    expect(parseDeepLink('homeownershub://community')).toBeNull();
  });

  it('returns null for a join link missing a code', () => {
    expect(parseDeepLink('homeownershub://join')).toBeNull();
  });
});
