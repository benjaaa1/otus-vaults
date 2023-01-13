import { NextApiHandler } from "next";

const manager: NextApiHandler = (req, res) => {
  // const { vault, network } = req.query;
  console.log({ req })
  // const userData = data.find(x => String(x.id) === String(id));

  // if (userData) {
  //   res.status(200).json(userData);
  // } else {
  //   res.status(404).end();
  // }
};

export default manager;
