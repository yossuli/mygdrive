interface ConfirmOptions {
  name: string;
  message: string;
}

declare module "enquirer" {
  export class Select<
    T extends {
      name: string;
      message: string;
      choices: { name: string }[];
      result?: (name: string) => any;
    },
  > {
    constructor(options: T);
    run(): Promise<
      ReturnType<
        T["result"] extends (name: string) => any ? T["result"] : string
      >
    >;
  }

  export class Confirm {
    constructor(options: ConfirmOptions);
    run(): Promise<boolean>;
  }

  const _default: {
    Select: typeof Select;
    Confirm: typeof Confirm;
  };
  export default _default;
}
