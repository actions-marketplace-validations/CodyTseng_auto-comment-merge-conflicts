import { describe, expect, jest, test } from '@jest/globals';
import { MergeableState } from '../src/enum';
import { RepositoryPullRequests } from '../src/interface';
import { QueryService } from '../src/query';
import { PullRequestService } from './../src/pull-request';

describe('PullRequestService', () => {
  const owner = 'codytseng';
  const repo = 'auto-comment-merge-conflicts';

  describe('getAllUnlockedPRs', () => {
    const queryService = new QueryService({} as any);
    const pullRequestService = new PullRequestService(
      queryService,
      owner,
      repo,
    );

    test('should get unlocked PRs success', async () => {
      const response1: RepositoryPullRequests = {
        repository: {
          pullRequests: {
            nodes: [
              {
                id: 'prId',
                number: 1,
                mergeable: MergeableState.Conflicting,
                locked: false,
                updatedAt: new Date().toUTCString(),
                comments: { nodes: [] },
              },
            ],
            pageInfo: {
              hasNextPage: true,
              endCursor: 'endCursor',
            },
          },
        },
      };
      const response2: RepositoryPullRequests = {
        repository: {
          pullRequests: {
            nodes: [
              {
                id: 'prId',
                number: 2,
                mergeable: MergeableState.Conflicting,
                locked: false,
                updatedAt: new Date().toUTCString(),
                comments: { nodes: [] },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: 'endCursor',
            },
          },
        },
      };

      const mockGetRepositoryPullRequest = jest
        .spyOn(queryService, 'getRepositoryPullRequests')
        .mockResolvedValueOnce(response1)
        .mockResolvedValueOnce(response2);

      const prs = await pullRequestService.getAllUnlockedPRs();
      expect(mockGetRepositoryPullRequest).toBeCalledTimes(2);
      expect(prs).toEqual([
        ...response1.repository.pullRequests.nodes,
        ...response2.repository.pullRequests.nodes,
      ]);
    });

    test('should filter locked PRs', async () => {
      const response: RepositoryPullRequests = {
        repository: {
          pullRequests: {
            nodes: [
              {
                id: 'prId',
                number: 1,
                mergeable: MergeableState.Conflicting,
                locked: true,
                updatedAt: new Date().toUTCString(),
                comments: { nodes: [] },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: 'endCursor',
            },
          },
        },
      };

      jest
        .spyOn(queryService, 'getRepositoryPullRequests')
        .mockResolvedValue(response);

      const prs = await pullRequestService.getAllUnlockedPRs();
      expect(prs).toEqual([]);
    });

    test('should throw an error when response data is empty', async () => {
      const response1: any = undefined;
      jest
        .spyOn(queryService, 'getRepositoryPullRequests')
        .mockResolvedValue(response1);
      expect(pullRequestService.getAllUnlockedPRs()).rejects.toThrow(
        `Failed to get list of PRs: ${JSON.stringify(response1)}`,
      );

      const response2: any = {};
      jest
        .spyOn(queryService, 'getRepositoryPullRequests')
        .mockResolvedValue(response2);
      expect(pullRequestService.getAllUnlockedPRs()).rejects.toThrow(
        `Failed to get list of PRs: ${JSON.stringify(response2)}`,
      );
    });

    test('should throw an error when response data has an unknown mergeable status PR', async () => {
      const response: RepositoryPullRequests = {
        repository: {
          pullRequests: {
            nodes: [
              {
                id: 'prId',
                number: 1,
                mergeable: MergeableState.Unknown,
                locked: false,
                updatedAt: new Date().toUTCString(),
                comments: { nodes: [] },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: 'endCursor',
            },
          },
        },
      };

      jest
        .spyOn(queryService, 'getRepositoryPullRequests')
        .mockResolvedValue(response);

      await expect(pullRequestService.getAllUnlockedPRs()).rejects.toThrow(
        'There is a pull request with unknown mergeable status.',
      );
    });
  });
});
