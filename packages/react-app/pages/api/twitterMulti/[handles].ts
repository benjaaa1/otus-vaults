import { NextApiHandler } from "next";
import { TwitterData } from "../utils/twitter";

const twitterMulti: NextApiHandler = async (req, res) => {
  // const { vault, network } = req.query;
  const { handles } = req.query;
  console.log({ handles })
  const _twitterData = await
    fetch(
      `https://api.twitter.com/2/users/by?usernames=${handles}&user.fields=profile_image_url`, {
      headers: new Headers({
        'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
      })
    });

  console.log({ _twitterData })
  const twitterProfiles: TwitterData[] = await _twitterData.json();

  if (twitterProfiles) {
    res.status(200).json(twitterProfiles);
  } else {
    res.status(404).end();
  }

};

export default twitterMulti;
