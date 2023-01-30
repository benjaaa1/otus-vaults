
import { Twitter, TwitterData } from '../../pages/api/utils/twitter'
import { useQuery } from 'react-query'
import QUERY_KEYS from '../../constants/queryKeys'

export const useTwitter = (twitter: string | undefined) => {
  return useQuery<TwitterData | null>(
    QUERY_KEYS.Leaderboard.Twitter(
      twitter || ''
    ),
    async () => {
      if (!twitter) return null
      const _twitterProfile = await fetch(`/api/twitter/${twitter}`);
      const _twitterJson = await _twitterProfile.json();

      return _twitterJson;
    }
  )
}

export const useTwitters = (twitterHandles: string[]) => {
  return useQuery<Record<string, Twitter>>(
    QUERY_KEYS.Leaderboard.Twitter(
      twitterHandles.join(',')
    ),
    async () => {
      // if (!twitterHandles) return null
      const _twitterProfile = await fetch(`/api/twitterMulti/${twitterHandles.join(',')}`);
      const _twitterJson = await _twitterProfile.json();

      return _twitterJson.data.reduce((accum: Record<string, Twitter>, val: Twitter) => {
        return { ...accum, [val.username]: val }
      }, {} as Record<string, Twitter>);
    }
  )
}