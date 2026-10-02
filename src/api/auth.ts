import { apiClient } from './client.ts';

/**
 * Probes the backend transactions endpoint with a candidate API key to verify its validity.
 * Overrides the default headers with the candidate key.
 *
 * @param candidateKey - The API key entered by the user
 * @returns Resolves true if key is valid (HTTP 200), or throws ApiError if rejected (HTTP 401)
 */
export async function probeApiKey(candidateKey: string): Promise<boolean> {
  const trimmed = candidateKey.trim();
  if (trimmed.length === 0) {
    throw new RangeError('Candidate API key cannot be empty');
  }

  await apiClient.get('api/v1/transactions', {
    searchParams: { limit: 1 },
    headers: {
      'X-Api-Key': trimmed,
    },
    context: {
      skipUnauthorizedHandler: true,
    },
  });

  return true;
}
