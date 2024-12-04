import express from "express";
import { join } from "path";
import "dotenv/config";

import homeRoutes from "./routes/homeRoutes";

const app = express();
const port = 3000;

app.use(express.static(join(__dirname, "public")));

app.use("/", homeRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
