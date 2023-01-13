import { NextApiHandler } from "next";
import { TwitterData } from "../utils/twitter";

const twitter: NextApiHandler = async (req, res) => {
  // const { vault, network } = req.query;
  console.log({ req })
  const { handle } = req.query;

  const _twitterData = await
    fetch(
      `https://api.twitter.com/2/users/by/username/${handle}?user.fields=profile_image_url`, {
      headers: new Headers({
        'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
      })
    });

  const twitterProfile: TwitterData = await _twitterData.json();
  console.log({ _twitterData, twitterProfile })
  if (twitterProfile) {
    res.status(200).json(twitterProfile);
  } else {
    res.status(404).end();
  }

};

export default twitter;
