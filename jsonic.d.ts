declare type Jsonic = ((src: any) => any) & {
    parse: (src: any) => any;
    use: (plugin: Plugin) => void;
} & {
    [prop: string]: any;
};
declare type Plugin = (jsonic: Jsonic) => void;
declare let Jsonic: Jsonic;
export { Jsonic, Plugin };
