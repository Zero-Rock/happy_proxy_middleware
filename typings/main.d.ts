import { IOptions } from "../src/interface";

export = DevServerMiddleware;

declare module "import-fresh";
declare module "chalk";
declare function DevServerMiddleware(options: IOptions);
declare namespace DevServerMiddleware {

}
