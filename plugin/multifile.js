/* Copyright (c) 2013-2021 Richard Rodger, MIT License */
/* $lab:coverage:off$ */
'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Multifile = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const jsonic_1 = require("../jsonic");
const json_1 = require("./json");
const csv_1 = require("./csv");
/* $lab:coverage:on$ */
let DEFAULTS = {
    markchar: '@',
    basepath: '.',
};
let Multifile = function multifile(jsonic) {
    let popts = jsonic_1.util.deep({}, DEFAULTS, jsonic.options.plugin.multifile);
    let markchar = popts.markchar;
    let tn = '#T<' + markchar + '>';
    jsonic.options({
        token: {
            [tn]: { c: markchar }
        },
        error: {
            multifile_unsupported_file: 'unsupported file: $path'
        },
        hint: {
            multifile_unsupported_file: `This file type is not supported and cannot be parsed: $path.`,
        },
    });
    // These inherit previous plugins - they are not clean new instances.
    let json = jsonic.make().use(json_1.Json, jsonic.options.plugin.json || {});
    let csv = jsonic.make().use(csv_1.Csv, jsonic.options.plugin.csv || {});
    let ST = jsonic.token.ST;
    let TX = jsonic.token.TX;
    let AT = jsonic.token(tn);
    jsonic.rule('val', (rs) => {
        rs.def.open.push({ s: [AT, ST] }, { s: [AT, TX] });
        let orig_before_close = rs.def.before_close;
        rs.def.before_close = function (rule, ctx) {
            if (rule.match[0] && AT === rule.match[0].tin) {
                // TODO: test TX=foo/bar as @"foo/bar" works but @foo/bar does not!
                let filepath = rule.match[1].val;
                let fullpath = path_1.default.resolve(ctx.meta.basepath || popts.basepath, filepath);
                let filedesc = path_1.default.parse(fullpath);
                let basepath = filedesc.dir;
                let file_ext = filedesc.ext.toLowerCase();
                let val;
                if ('.js' === file_ext) {
                    val = require(fullpath);
                    if ('function' === typeof val) {
                        val = val({ fullpath, filepath, rule, ctx });
                    }
                }
                // Manually load file contents
                else {
                    let partial_ctx = {
                        root: ctx.root
                    };
                    let content;
                    if ('.json' === file_ext) {
                        content = fs_1.default.readFileSync(fullpath).toString();
                        val = json(content, { fileName: fullpath }, partial_ctx);
                    }
                    else if ('.jsonic' === file_ext) {
                        content = fs_1.default.readFileSync(fullpath).toString();
                        val = jsonic(content, { basepath: basepath, fileName: fullpath }, partial_ctx);
                    }
                    /* $lab:coverage:off$ */
                    else if ('.csv' === file_ext) {
                        content = fs_1.default.readFileSync(fullpath).toString();
                        val = csv(content, {}, partial_ctx);
                    }
                    else {
                        return {
                            err: 'multifile_unsupported_file',
                            path: fullpath,
                        };
                    }
                    /* $lab:coverage:on$ */
                }
                rule.match[0].val = val;
            }
            return orig_before_close(...arguments);
        };
        return rs;
    });
};
exports.Multifile = Multifile;
//# sourceMappingURL=multifile.js.map