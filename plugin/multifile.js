"use strict";
/* Copyright (c) 2013-2020 Richard Rodger, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Multifile = void 0;
// TODO: use prev code
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const jsonic_1 = require("../jsonic");
const json_1 = require("./json");
const csv_1 = require("./csv");
let DEFAULTS = {
    char: '@',
    basepath: '.',
};
let Multifile = function multifile(jsonic) {
    let popts = jsonic_1.util.deep({}, DEFAULTS, jsonic.options.plugin.multifile);
    let atchar = popts.char;
    // console.log('MF popts', popts)
    jsonic.options({
        single: jsonic.options.single + atchar
    });
    // TODO: lexer+parser constructors to handle parent arg
    // These need to inherit previous plugins - they are not clean new instances
    let json = jsonic.make().use(json_1.Json, jsonic.options.plugin.json || {});
    let csv = jsonic.make().use(csv_1.Csv, jsonic.options.plugin.csv || {});
    let ST = jsonic.options.ST;
    let TX = jsonic.options.TX;
    let AT = jsonic.options.TOKENS[atchar];
    AT.mark = Math.random();
    //console.log('AT', AT)
    jsonic.rule('val', (rs) => {
        //console.log('RSO', rs.def.open.mark)
        rs.def.open.push({ s: [AT, ST] }, { s: [AT, TX] });
        let bc = rs.def.before_close;
        rs.def.before_close = (rule, ctx) => {
            if (rule.open[0]) {
                //console.log('MF bc AT', AT)
                if (AT === rule.open[0].pin) {
                    // TODO: text TX=foo/bar as @"foo/bar" works but @foo/bar does not!
                    let filepath = rule.open[1].val;
                    let fullpath = path_1.default.resolve(ctx.meta.basepath || popts.basepath, filepath);
                    let filedesc = path_1.default.parse(fullpath);
                    let basepath = filedesc.dir;
                    let file_ext = filedesc.ext.toLowerCase();
                    // console.log('FILE', filepath, fullpath, basepath)
                    let val;
                    if ('.js' === file_ext) {
                        val = require(fullpath);
                        if ('function' === typeof val) {
                            val = val();
                        }
                    }
                    // Manually load file contents
                    else {
                        let content = fs_1.default.readFileSync(fullpath).toString();
                        if ('.json' === file_ext) {
                            val = json(content, { mode: 'json', fileName: fullpath });
                        }
                        else if ('.jsonic' === file_ext) {
                            // TODO: need a way to init root node so refs work!
                            val = jsonic(content, { basepath: basepath, fileName: fullpath });
                            // TODO: test make preserves plugins
                            //.make({ plugin: { multifile: { basepath: basepath } } })
                            //.parse(content)
                        }
                        if ('.csv' === file_ext) {
                            val = csv(content);
                        }
                    }
                    rule.open[0].val = val;
                }
            }
            return bc(rule);
        };
        return rs;
    });
};
exports.Multifile = Multifile;
//# sourceMappingURL=multifile.js.map