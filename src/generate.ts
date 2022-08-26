#!/usr/bin/env ts-node

import { generateApplicationClient, AppSpec } from "./generate/";
import fs from "fs";


// TODO: make this friendly
// Currently `npm run gen $spec_path_to_read $path_to_write_generated_client
const args = process.argv
const path = args[args.length-1]
const spec = args[args.length-2]

generateApplicationClient(
  JSON.parse(fs.readFileSync(spec).toString()) as AppSpec,
  path 
);