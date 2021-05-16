(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Crochet = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (Buffer){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinaryReader = exports.BinaryWriter = exports.BufferedWriter = void 0;
const util_1 = require("util");
//import { logger } from "../utils/logger";
const logger = {
    debug(...x) { },
};
class BufferedWriter {
    constructor() {
        this.chunks = [];
    }
    write(chunk) {
        this.chunks.push(chunk);
    }
    collect() {
        return Buffer.concat(this.chunks);
    }
}
exports.BufferedWriter = BufferedWriter;
class BinaryWriter {
    constructor(target) {
        this.target = target;
    }
    uint8(x) {
        if (!Number.isInteger(x) || x < 0 || x > 255) {
            throw new Error(`internal: Invalid uint8 ${x}`);
        }
        const buffer = Buffer.alloc(1);
        buffer.writeUInt8(x);
        this.target.write(buffer);
        logger.debug(`Wrote uint8 ${x}`);
    }
    uint16(x) {
        if (!Number.isInteger(x) || x < 0 || x >= 2 ** 16) {
            throw new Error(`internal: Invalid uint16 ${x}`);
        }
        const buffer = Buffer.alloc(2);
        buffer.writeUInt16LE(x);
        this.target.write(buffer);
        logger.debug(`Wrote uint16 ${x}`);
    }
    uint32(x) {
        if (!Number.isInteger(x) || x < 0 || x >= 2 ** 32) {
            throw new Error(`internal: Invalid uint32 ${x}`);
        }
        const buffer = Buffer.alloc(4);
        buffer.writeUInt32LE(x);
        this.target.write(buffer);
        logger.debug(`Wrote uint32 ${x}`);
    }
    boolean(x) {
        logger.debug(`Writing boolean ${x}`);
        this.uint8(x ? 1 : 0);
    }
    maybe(x, f) {
        logger.debug(`Writing maybe ${util_1.inspect(x)}`);
        if (x == null) {
            this.boolean(false);
        }
        else {
            this.boolean(true);
            f(x);
        }
    }
    array(xs, f) {
        logger.debug(`Writing array of length ${xs.length} - ${util_1.inspect(xs)}`);
        this.uint32(xs.length);
        for (const x of xs) {
            f(x);
        }
    }
    map(map, f) {
        logger.debug(`Writing map of length ${map.size} - ${util_1.inspect(map)}`);
        this.uint32(map.size);
        for (const [k, v] of map.entries()) {
            f(k, v);
        }
    }
    uint64(x) {
        if (!Number.isInteger(x)) {
            throw new Error(`internal: Invalid integer ${x}`);
        }
        const buffer = Buffer.alloc(8);
        buffer.writeBigInt64LE(BigInt(x));
        this.target.write(buffer);
        logger.debug(`Wrote int64 ${x}`);
    }
    bigint(x) {
        logger.debug(`Writing bigint ${x}`);
        let bytes = (x < 0 ? -x : x).toString(16);
        if (bytes.length % 2 != 0)
            bytes = "0" + bytes;
        const buffer = new Uint8Array(bytes.length / 2);
        for (let i = 0; i < buffer.length; ++i) {
            buffer[i] = parseInt(bytes.substr(i * 2, 2), 16);
        }
        logger.debug(`Bytes are ${util_1.inspect(buffer)}`);
        this.boolean(x < 0);
        this.bytes(Buffer.from(buffer));
    }
    double(x) {
        const buffer = Buffer.alloc(8);
        buffer.writeDoubleLE(x);
        this.target.write(buffer);
        logger.debug(`Wrote double ${x}`);
    }
    text(x) {
        const buffer = Buffer.from(x, "utf-8");
        this.target.write(buffer);
        logger.debug(`Wrote text ${x}`);
    }
    string(x) {
        logger.debug(`Writing string ${x}`);
        const buffer = Buffer.from(x, "utf-8");
        this.bytes(buffer);
    }
    bytes(x) {
        this.uint32(x.length);
        this.target.write(x);
        logger.debug(`Wrote bytes ${x.toString("hex")}`);
    }
}
exports.BinaryWriter = BinaryWriter;
class BinaryReader {
    constructor(source) {
        this.source = source;
        this.offset = 0;
    }
    uint8() {
        const result = this.source.readUInt8(this.offset);
        logger.debug(`Read uint8 ${result} at ${this.offset.toString(16)}`);
        this.offset += 1;
        return result;
    }
    uint16() {
        const result = this.source.readUInt16LE(this.offset);
        logger.debug(`Read uint16 ${result} at ${this.offset.toString(16)}`);
        this.offset += 2;
        return result;
    }
    uint32() {
        const result = this.source.readUInt32LE(this.offset);
        logger.debug(`Read uint32 ${result} at ${this.offset.toString(16)}`);
        this.offset += 4;
        return result;
    }
    uint64() {
        const result = this.source.readBigUInt64LE(this.offset);
        logger.debug(`Read uint64 ${result} at ${this.offset.toString(16)}`);
        this.offset += 8;
        return Number(result);
    }
    bigint() {
        logger.debug(`Reading bigint at ${this.offset.toString(16)}`);
        const negative = this.boolean();
        const bytes = this.bytes();
        const result = BigInt(`0x${bytes.toString("hex")}`);
        logger.debug(`Read bigint ${result} at ${this.offset.toString(16)}. Bytes are ${util_1.inspect(bytes)}`);
        return negative ? -result : result;
    }
    boolean() {
        const result = this.uint8();
        if (result === 0) {
            logger.debug(`Read boolean true at ${this.offset.toString(16)}`);
            return false;
        }
        else if (result === 1) {
            logger.debug(`Read boolean false at ${this.offset.toString(16)}`);
            return true;
        }
        else {
            throw new Error(`Invalid boolean ${result} at position ${this.offset}`);
        }
    }
    maybe(f) {
        logger.debug(`Reading maybe at ${this.offset.toString(16)}`);
        if (this.boolean()) {
            return f();
        }
        else {
            return null;
        }
    }
    array(f) {
        logger.debug(`Reading array at ${this.offset.toString(16)}`);
        const length = this.uint32();
        const result = [];
        for (let i = 0; i < length; ++i) {
            const item = f(i);
            logger.debug(`Read array item ${util_1.inspect(item)} at ${this.offset.toString(16)}`);
            result.push(item);
        }
        logger.debug(`Read array ${util_1.inspect(result)} at ${this.offset.toString(16)}`);
        return result;
    }
    map(f) {
        logger.debug(`Reading map at ${this.offset.toString(16)}`);
        const length = this.uint32();
        const result = new Map();
        for (let i = 0; i < length; ++i) {
            const [k, v] = f(i);
            logger.debug(`Read map pair ${util_1.inspect(k)}=${util_1.inspect(v)} at ${this.offset.toString(16)}`);
            result.set(k, v);
        }
        logger.debug(`Read map ${util_1.inspect(result)} at ${this.offset.toString(16)}`);
        return result;
    }
    double() {
        const result = this.source.readDoubleLE(this.offset);
        logger.debug(`Read double ${result} at ${this.offset.toString(16)}`);
        this.offset += 8;
        return result;
    }
    bytes_with_size(size) {
        const result = this.source.slice(this.offset, this.offset + size);
        logger.debug(`Read bytes ${result.toString("hex")} at ${this.offset.toString(16)}`);
        this.offset += size;
        return result;
    }
    bytes() {
        const length = this.uint32();
        return this.bytes_with_size(length);
    }
    text(x) {
        logger.debug(`Reading text at ${this.offset.toString(16)}`);
        const byteLength = Buffer.from(x, "utf-8").length;
        const result = this.bytes_with_size(byteLength).toString("utf-8");
        logger.debug(`Read text ${result} at ${this.offset.toString(16)}`);
        if (result !== x) {
            throw new Error(`Expected ${x}, got ${result} at position ${this.offset}`);
        }
        return result;
    }
    string() {
        logger.debug(`Reading string at ${this.offset.toString(16)}`);
        const bytes = this.bytes();
        const result = bytes.toString("utf-8");
        logger.debug(`Read string ${result} at ${this.offset.toString(16)}`);
        return result;
    }
}
exports.BinaryReader = BinaryReader;

}).call(this)}).call(this,require("buffer").Buffer)
},{"buffer":65,"util":85}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section = exports.VERSION = exports.MAGIC = void 0;
exports.MAGIC = "CROC";
exports.VERSION = 27;
var Section;
(function (Section) {
    Section[Section["DECLARATION"] = 1] = "DECLARATION";
    Section[Section["SOURCE_INFO"] = 2] = "SOURCE_INFO";
})(Section = exports.Section || (exports.Section = {}));

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode_program = exports.decode_header = void 0;
const IR = require("../ir");
//import { logger } from "../utils/logger";
const logger = {
    debug(...x) { },
};
const utils_1 = require("../utils/utils");
const binary_1 = require("./binary");
const constants_1 = require("./constants");
class CrochetIRDecoder extends binary_1.BinaryReader {
    constructor(source) {
        super(source);
    }
    get_header() {
        this.text(constants_1.MAGIC);
        const version = this.uint16();
        const hash = this.bytes();
        return { hash, version };
    }
    assert_version(x) {
        this.expect(constants_1.VERSION, x.version, "version");
    }
    expect(expected, got, tag) {
        if (got === expected) {
            return got;
        }
        else {
            throw new Error(`Unexpected ${tag}. Got ${got}, but expected ${expected}`);
        }
    }
    decode_program() {
        const header = this.get_header();
        this.assert_version(header);
        const filename = this.string();
        const declarations = this.decode_declarations();
        const meta_table = this.decode_meta_table();
        return new IR.Program(filename, meta_table.source, meta_table.table, declarations);
    }
    decode_declarations() {
        this.expect(constants_1.Section.DECLARATION, this.decode_enum_tag(constants_1.Section, "section"), "Declaration section");
        return this.array((_) => this.decode_declaration());
    }
    decode_declaration() {
        const t = IR.DeclarationTag;
        const tag = this.decode_enum_tag(t, "declaration");
        switch (tag) {
            case t.COMMAND: {
                return new IR.DCommand(this.decode_meta_id(), this.string(), this.string(), this.array((_) => this.string()), this.array((_) => this.decode_type()), this.decode_basic_block());
            }
            case t.TYPE:
                return new IR.DType(this.decode_meta_id(), this.string(), this.decode_enum_tag(IR.Visibility, "visibility"), this.string(), this.decode_type(), this.array((_) => this.string()), this.array((_) => this.decode_type()));
            case t.SEAL:
                return new IR.DSeal(this.decode_meta_id(), this.string());
            case t.TEST:
                return new IR.DTest(this.decode_meta_id(), this.string(), this.decode_basic_block());
            case t.DEFINE:
                return new IR.DDefine(this.decode_meta_id(), this.string(), this.decode_enum_tag(IR.Visibility, "Visibility"), this.string(), this.decode_basic_block());
            case t.OPEN:
                return new IR.DOpen(this.decode_meta_id(), this.string());
            case t.PRELUDE:
                return new IR.DPrelude(this.decode_meta_id(), this.decode_basic_block());
            case t.RELATION:
                return new IR.DRelation(this.decode_meta_id(), this.string(), this.string(), this.array((_) => new IR.RelationType(this.decode_meta_id(), this.decode_enum_tag(IR.RelationMultiplicity, "multiplicity"))));
            case t.ACTION:
                return new IR.DAction(this.decode_meta_id(), this.string(), this.maybe(() => this.string()), this.string(), this.decode_type(), this.string(), this.decode_basic_block(), this.decode_predicate(), this.decode_basic_block());
            case t.WHEN:
                return new IR.DWhen(this.decode_meta_id(), this.string(), this.maybe(() => this.string()), this.decode_predicate(), this.decode_basic_block());
            case t.CONTEXT:
                return new IR.DContext(this.decode_meta_id(), this.string(), this.string());
            case t.FOREIGN_TYPE:
                return new IR.DForeignType(this.decode_meta_id(), this.string(), this.decode_enum_tag(IR.Visibility, "visibility"), this.string(), this.string());
            case t.EFFECT: {
                return new IR.DEffect(this.decode_meta_id(), this.string(), this.string(), this.array((_) => new IR.EffectCase(this.decode_meta_id(), this.string(), this.string(), this.array((_) => this.string()), this.array((_) => this.decode_type()))));
            }
            default:
                throw utils_1.unreachable(tag, "Declaration");
        }
    }
    decode_handler_case() {
        return new IR.HandlerCase(this.decode_meta_id(), this.string(), this.string(), this.array((_) => this.string()), this.decode_basic_block());
    }
    decode_type() {
        const tag = this.decode_enum_tag(IR.TypeTag, "type");
        switch (tag) {
            case IR.TypeTag.ANY: {
                return new IR.AnyType();
            }
            case IR.TypeTag.UNKNOWN: {
                return new IR.UnknownType();
            }
            case IR.TypeTag.GLOBAL: {
                return new IR.GlobalType(this.decode_meta_id(), this.string(), this.string());
            }
            case IR.TypeTag.LOCAL: {
                return new IR.LocalType(this.decode_meta_id(), this.string());
            }
            case IR.TypeTag.LOCAL_STATIC: {
                return new IR.StaticType(this.decode_meta_id(), this.string());
            }
            default:
                throw utils_1.unreachable(tag, "Type");
        }
    }
    decode_basic_block() {
        return new IR.BasicBlock(this.array((_) => this.decode_op()));
    }
    decode_op() {
        const t = IR.OpTag;
        const tag = this.decode_enum_tag(IR.OpTag, "operation");
        switch (tag) {
            case t.DROP: {
                return new IR.Drop(this.decode_meta_id());
            }
            case t.LET:
                return new IR.Let(this.decode_meta_id(), this.string());
            case t.PUSH_VARIABLE:
                return new IR.PushVariable(this.decode_meta_id(), this.string());
            case t.PUSH_SELF:
                return new IR.PushSelf(this.decode_meta_id());
            case t.PUSH_GLOBAL:
                return new IR.PushGlobal(this.decode_meta_id(), this.string());
            case t.PUSH_LITERAL:
                return new IR.PushLiteral(this.decode_literal());
            case t.PUSH_RETURN:
                return new IR.PushReturn(this.decode_meta_id());
            case t.PUSH_TUPLE:
                return new IR.PushTuple(this.decode_meta_id(), this.uint32());
            case t.PUSH_NEW:
                return new IR.PushNew(this.decode_meta_id(), this.decode_type(), this.uint32());
            case t.PUSH_STATIC_TYPE:
                return new IR.PushStaticType(this.decode_meta_id(), this.decode_type());
            case t.PUSH_RECORD:
                return new IR.PushRecord(this.decode_meta_id(), this.array((_) => this.string()));
            case t.RECORD_AT_PUT:
                return new IR.RecordAtPut(this.decode_meta_id());
            case t.PROJECT:
                return new IR.Project(this.decode_meta_id());
            case t.PROJECT_STATIC:
                return new IR.ProjectStatic(this.decode_meta_id(), this.string());
            case t.PUSH_LAZY:
                return new IR.PushLazy(this.decode_meta_id(), this.decode_basic_block());
            case t.FORCE:
                return new IR.Force(this.decode_meta_id());
            case t.INTERPOLATE:
                return new IR.Interpolate(this.decode_meta_id(), this.array((_) => this.maybe(() => this.string())));
            case t.PUSH_LAMBDA:
                return new IR.PushLambda(this.decode_meta_id(), this.array((_) => this.string()), this.decode_basic_block());
            case t.INVOKE_FOREIGN:
                return new IR.InvokeForeign(this.decode_meta_id(), this.string(), this.uint32());
            case t.INVOKE:
                return new IR.Invoke(this.decode_meta_id(), this.string(), this.uint32());
            case t.APPLY:
                return new IR.Apply(this.decode_meta_id(), this.uint32());
            case t.RETURN:
                return new IR.Return(this.decode_meta_id());
            case t.PUSH_PARTIAL:
                return new IR.PushPartial(this.decode_meta_id(), this.string(), this.uint32());
            case t.ASSERT:
                return new IR.Assert(this.decode_meta_id(), this.decode_enum_tag(IR.AssertType, "assertion type"), this.string(), this.string(), this.maybe(() => [this.string(), this.array(() => this.string())]));
            case t.BRANCH:
                return new IR.Branch(this.decode_meta_id(), this.decode_basic_block(), this.decode_basic_block());
            case t.TYPE_TEST:
                return new IR.TypeTest(this.decode_meta_id(), this.decode_type());
            case t.INTRINSIC_EQUAL:
                return new IR.IntrinsicEqual(this.decode_meta_id());
            case t.REGISTER_INSTANCE:
                return new IR.RegisterInstance(this.decode_meta_id());
            case t.SEARCH:
                return new IR.Search(this.decode_meta_id(), this.decode_predicate());
            case t.MATCH_SEARCH:
                return new IR.MatchSearch(this.decode_meta_id(), this.decode_basic_block(), this.decode_basic_block());
            case t.FACT:
                return new IR.Fact(this.decode_meta_id(), this.string(), this.uint32());
            case t.FORGET:
                return new IR.Forget(this.decode_meta_id(), this.string(), this.uint32());
            case t.SIMULATE:
                return new IR.Simulate(this.decode_meta_id(), this.maybe(() => this.string()), this.decode_simulation_goal(), this.array((_) => new IR.SimulationSignal(this.decode_meta_id(), this.array((_) => this.string()), this.string(), this.decode_basic_block())));
            case t.HANDLE: {
                return new IR.Handle(this.decode_meta_id(), this.decode_basic_block(), this.array((_) => this.decode_handler_case()));
            }
            case t.PERFORM: {
                return new IR.Perform(this.decode_meta_id(), this.string(), this.string(), this.uint32());
            }
            case t.CONTINUE_WITH: {
                return new IR.ContinueWith(this.decode_meta_id());
            }
            case t.DSL: {
                return new IR.Dsl(this.decode_meta_id(), this.decode_type(), this.array((_) => this.decode_dsl_node()));
            }
            default:
                throw utils_1.unreachable(tag, "Operation");
        }
    }
    decode_dsl_node() {
        const tag = this.decode_enum_tag(IR.DslNodeTag, "DSL Node");
        switch (tag) {
            case IR.DslNodeTag.NODE: {
                return new IR.DslAstNode(this.decode_dsl_meta(), this.string(), this.array((_) => this.decode_dsl_node()), this.map((_) => [this.string(), this.decode_dsl_node()]));
            }
            case IR.DslNodeTag.LITERAL: {
                return new IR.DslAstLiteral(this.decode_dsl_meta(), this.decode_literal());
            }
            case IR.DslNodeTag.VARIABLE: {
                return new IR.DslAstVariable(this.decode_dsl_meta(), this.string());
            }
            case IR.DslNodeTag.EXPRESSION: {
                return new IR.DslAstExpression(this.decode_dsl_meta(), this.string(), this.decode_basic_block());
            }
            case IR.DslNodeTag.LIST: {
                return new IR.DslAstNodeList(this.decode_dsl_meta(), this.array((_) => this.decode_dsl_node()));
            }
            case IR.DslNodeTag.INTERPOLATION: {
                return new IR.DslAstInterpolation(this.decode_dsl_meta(), this.array((_) => this.decode_dsl_interpolation_part()));
            }
            default:
                throw utils_1.unreachable(tag, `DSL Node`);
        }
    }
    decode_dsl_interpolation_part() {
        const tag = this.decode_enum_tag(IR.DslInterpolationTag, "DSL Interpolation part");
        switch (tag) {
            case IR.DslInterpolationTag.STATIC: {
                return new IR.DslInterpolationStatic(this.string());
            }
            case IR.DslInterpolationTag.DYNAMIC: {
                return new IR.DslInterpolationDynamic(this.decode_dsl_node());
            }
            default:
                throw utils_1.unreachable(tag, "DSL Interpolation tag");
        }
    }
    decode_dsl_meta() {
        const line = this.uint32();
        const column = this.uint32();
        return { line, column };
    }
    decode_simulation_goal() {
        const t = IR.SimulationGoalTag;
        const tag = this.decode_enum_tag(t, "simulation goal");
        switch (tag) {
            case t.ACTION_QUIESCENCE:
                return new IR.SGActionQuiescence(this.decode_meta_id());
            case t.EVENT_QUIESCENCE:
                return new IR.SGEventQuiescence(this.decode_meta_id());
            case t.TOTAL_QUIESCENCE:
                return new IR.SGTotalQuiescence(this.decode_meta_id());
            case t.PREDICATE:
                return new IR.SGPredicate(this.decode_meta_id(), this.decode_predicate());
            default:
                throw utils_1.unreachable(tag, "Simulation goal");
        }
    }
    decode_predicate() {
        const t = IR.PredicateTag;
        const tag = this.decode_enum_tag(IR.PredicateTag, "predicate");
        switch (tag) {
            case t.AND:
                return new IR.PAnd(this.decode_meta_id(), this.decode_predicate(), this.decode_predicate());
            case t.OR:
                return new IR.POr(this.decode_meta_id(), this.decode_predicate(), this.decode_predicate());
            case t.NOT:
                return new IR.PNot(this.decode_meta_id(), this.decode_predicate());
            case t.RELATION:
                return new IR.PRelation(this.decode_meta_id(), this.string(), this.array((_) => this.decode_pattern()));
            case t.SAMPLE_RELATION:
                return new IR.PSampleRelation(this.decode_meta_id(), this.uint32(), this.string(), this.array((_) => this.decode_pattern()));
            case t.SAMPLE_TYPE:
                return new IR.PSampleType(this.decode_meta_id(), this.uint32(), this.string(), this.decode_type());
            case t.CONSTRAIN:
                return new IR.PConstrained(this.decode_meta_id(), this.decode_predicate(), this.decode_basic_block());
            case t.LET:
                return new IR.PLet(this.decode_meta_id(), this.string(), this.decode_basic_block());
            case t.TYPE:
                return new IR.PType(this.decode_meta_id(), this.string(), this.decode_type());
            case t.ALWAYS:
                return new IR.PAlways(this.decode_meta_id());
            default:
                throw utils_1.unreachable(tag, "Predicate");
        }
    }
    decode_pattern() {
        const t = IR.PatternTag;
        const tag = this.decode_enum_tag(IR.PatternTag, "pattern");
        switch (tag) {
            case t.HAS_TYPE:
                return new IR.TypePattern(this.decode_meta_id(), this.decode_type(), this.decode_pattern());
            case t.LITERAL:
                return new IR.LiteralPattern(this.decode_meta_id(), this.decode_literal());
            case t.GLOBAL:
                return new IR.GlobalPattern(this.decode_meta_id(), this.string());
            case t.SELF:
                return new IR.SelfPattern(this.decode_meta_id());
            case t.VARIABLE:
                return new IR.VariablePattern(this.decode_meta_id(), this.string());
            case t.WILDCARD:
                return new IR.WildcardPattern(this.decode_meta_id());
            default:
                throw utils_1.unreachable(tag, "Pattern");
        }
    }
    decode_literal() {
        const t = IR.LiteralTag;
        const tag = this.decode_enum_tag(IR.LiteralTag, "literal");
        switch (tag) {
            case t.NOTHING:
                return new IR.LiteralNothing();
            case t.TRUE:
                return new IR.LiteralTrue();
            case t.FALSE:
                return new IR.LiteralFalse();
            case t.INTEGER:
                return new IR.LiteralInteger(this.bigint());
            case t.FLOAT_64:
                return new IR.LiteralFloat64(this.double());
            case t.TEXT:
                return new IR.LiteralText(this.string());
            default:
                throw utils_1.unreachable(tag, "Literal");
        }
    }
    decode_meta_table() {
        this.expect(constants_1.Section.SOURCE_INFO, this.decode_enum_tag(constants_1.Section, "section"), "section");
        const source = this.string();
        const table = this.map((_) => {
            const key = this.uint32();
            const start = this.uint32();
            const end = this.uint32();
            return [key, new IR.Interval({ start, end })];
        });
        return { source, table };
    }
    decode_meta_id() {
        return this.uint32();
    }
    decode_enum_tag(tags, name) {
        const tag = this.uint8();
        if (tags[tag] == null) {
            throw new Error(`Invalid ${name} tag ${tag} at position ${this.offset}`);
        }
        logger.debug(`Read ${name} tag ${tag} (${tags[tag]})`);
        return tag;
    }
}
function decode_header(buffer) {
    return new CrochetIRDecoder(buffer).get_header();
}
exports.decode_header = decode_header;
function decode_program(buffer) {
    return new CrochetIRDecoder(buffer).decode_program();
}
exports.decode_program = decode_program;

},{"../ir":11,"../utils/utils":28,"./binary":1,"./constants":2}],4:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./binary"), exports);
__exportStar(require("./decoder"), exports);
__exportStar(require("./constants"), exports);

},{"./binary":1,"./constants":2,"./decoder":3}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BootedCrochet = exports.Crochet = void 0;
const Path = require("path");
const Package = require("../pkg");
const IR = require("../ir");
const VM = require("../vm");
const Binary = require("../binary");
const logger_1 = require("../utils/logger");
const foreign_1 = require("./foreign");
class Crochet {
    constructor(fs, signal) {
        this.fs = fs;
        this.signal = signal;
        this.trusted = new Set();
        this.registered_packages = new Map();
        this.resolver = {
            get_package: async (name) => {
                return this.get_package(name);
            },
        };
    }
    async boot(root, target) {
        const pkg = await this.get_package(root);
        const graph = await Package.build_package_graph(pkg, target, this.trusted, this.resolver);
        if (await this.signal.request_capabilities(graph, pkg)) {
        }
        else {
            throw new Error(`Aborting boot because the system denied the required capabilities.`);
        }
        return new BootedCrochet(this, graph);
    }
    trust(pkg) {
        this.trusted.add(pkg);
    }
    async register_package_from_file(filename) {
        const source = await this.fs.read_file(filename);
        const pkg = Package.parse_from_string(source, filename);
        return this.register_package(pkg);
    }
    async register_package(pkg) {
        const old = this.registered_packages.get(pkg.meta.name);
        if (old != null) {
            if (Path.resolve(old.filename) !== Path.resolve(pkg.filename)) {
                throw new Error([
                    `Duplicated package ${pkg.meta.name}.\n`,
                    `Defined in ${pkg.filename} and ${old.filename}`,
                ].join(""));
            }
            else {
                return old;
            }
        }
        logger_1.logger.debug(`Registered package ${pkg.meta.name} for ${pkg.filename}`);
        this.registered_packages.set(pkg.meta.name, pkg);
        return pkg;
    }
    async get_package(name) {
        const pkg = this.registered_packages.get(name);
        if (pkg == null) {
            const pkg = await this.fs.read_package(name);
            this.register_package(pkg);
            return pkg;
        }
        return pkg;
    }
}
exports.Crochet = Crochet;
class BootedCrochet {
    constructor(crochet, graph) {
        this.crochet = crochet;
        this.graph = graph;
        this.initialised = false;
        this.universe = VM.make_universe();
    }
    async initialise(root) {
        if (this.initialised) {
            throw new Error(`initialise() called twice!`);
        }
        this.initialised = true;
        const pkg = this.graph.get_package(root);
        for (const x of this.graph.serialise(pkg)) {
            await this.load_package(x);
        }
        await VM.run_prelude(this.universe);
    }
    async run(name, args) {
        this.assert_initialised();
        const result = await VM.run_command(this.universe, name, args);
        return result;
    }
    assert_initialised() {
        if (!this.initialised) {
            throw new Error(`The VM has not been initialised yet.`);
        }
    }
    async load_package(pkg) {
        logger_1.logger.debug(`Loading package ${pkg.name}`);
        const cpkg = VM.World.get_or_make_package(this.universe.world, pkg);
        for (const x of pkg.native_sources) {
            await this.load_native(x, pkg, cpkg);
        }
        for (const x of pkg.sources) {
            await this.load_source(x, pkg, cpkg);
        }
    }
    async load_native(x, pkg, cpkg) {
        logger_1.logger.debug(`Loading native module ${x.relative_filename} from package ${pkg.name}`);
        const module = await this.crochet.fs.read_native_module(x, pkg);
        const ffi = new foreign_1.ForeignInterface(this.universe, cpkg, x.relative_filename);
        await module(ffi);
    }
    async load_source(x, pkg, cpkg) {
        logger_1.logger.debug(`Loading module ${x.relative_filename} from package ${pkg.name}`);
        const buffer = await this.crochet.fs.read_binary(x, pkg);
        const header = Binary.decode_header(buffer);
        if (header.version !== Binary.VERSION) {
            throw new Error([
                `Failed to load ${x.relative_filename} in ${pkg.name}. `,
                `The compiled binary image cannot be decoded by this VM `,
                `due to a version mismatch (expected ${Binary.VERSION}, `,
                `found ${header.version})`,
            ].join(""));
        }
        const ir = Binary.decode_program(buffer);
        const module = VM.load_module(this.universe, cpkg, ir);
        return module;
    }
    async run_tests(filter) {
        const tests0 = VM.Tests.grouped_tests(this.universe);
        const { total, skipped, tests: tests1 } = VM.Tests.filter_grouped_tests(tests0, filter);
        const failures = [];
        const start = new Date().getTime();
        for (const [group, modules] of tests1) {
            console.log("");
            console.log(group);
            console.log("=".repeat(72));
            for (const [module, tests] of modules) {
                console.log("");
                console.log(module);
                console.log("-".repeat(72));
                for (const test of tests) {
                    try {
                        await VM.run_test(this.universe, test);
                        console.log(`[OK]    ${test.title}`);
                    }
                    catch (error) {
                        console.log("-".repeat(3));
                        console.log(`[ERROR] ${test.title}`);
                        console.log(error.stack ?? error);
                        console.log("-".repeat(3));
                        failures.push(error);
                    }
                }
            }
        }
        const end = new Date().getTime();
        const diff = end - start;
        console.log("");
        console.log("-".repeat(72));
        console.log(`${total} tests in ${diff}ms  |  ${skipped} skipped  |  ${failures.length} failed`);
    }
    async load_declaration(x, module) {
        VM.load_declaration(this.universe, module, x);
    }
    async run_block(x, env) {
        const block = new IR.BasicBlock([...x.ops, new IR.Return(0)]);
        return await VM.run_block(this.universe, env, block);
    }
    async invoke(name, args) {
        return await VM.run_command(this.universe, name, args);
    }
}
exports.BootedCrochet = BootedCrochet;

},{"../binary":4,"../ir":11,"../pkg":19,"../utils/logger":26,"../vm":33,"./foreign":6,"path":81}],6:[function(require,module,exports){
"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _universe, _package, _module;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForeignInterface = void 0;
const xorshift_1 = require("../utils/xorshift");
const vm_1 = require("../vm");
class ForeignInterface {
    constructor(universe, pkg, filename) {
        _universe.set(this, void 0);
        _package.set(this, void 0);
        _module.set(this, void 0);
        __classPrivateFieldSet(this, _universe, universe);
        __classPrivateFieldSet(this, _package, pkg);
        __classPrivateFieldSet(this, _module, new vm_1.CrochetModule(pkg, filename, null));
    }
    defun(name, fn) {
        __classPrivateFieldGet(this, _package).native_functions.define(name, new vm_1.NativeFunction(vm_1.NativeTag.NATIVE_SYNCHRONOUS, name, __classPrivateFieldGet(this, _package), fn));
    }
    defmachine(name, fn) {
        __classPrivateFieldGet(this, _package).native_functions.define(name, new vm_1.NativeFunction(vm_1.NativeTag.NATIVE_MACHINE, name, __classPrivateFieldGet(this, _package), fn));
    }
    // == Constructors
    integer(x) {
        return vm_1.Values.make_integer(__classPrivateFieldGet(this, _universe), x);
    }
    float(x) {
        return vm_1.Values.make_float(__classPrivateFieldGet(this, _universe), x);
    }
    boolean(x) {
        return vm_1.Values.make_boolean(__classPrivateFieldGet(this, _universe), x);
    }
    text(x) {
        return vm_1.Values.make_text(__classPrivateFieldGet(this, _universe), x);
    }
    box(x) {
        return vm_1.Values.box(__classPrivateFieldGet(this, _universe), x);
    }
    // FIXME: this shouldn't be available to non-trusted packages
    static_text(x) {
        return vm_1.Values.make_static_text(__classPrivateFieldGet(this, _universe), x);
    }
    tuple(x) {
        return vm_1.Values.make_tuple(__classPrivateFieldGet(this, _universe), x);
    }
    record(x) {
        return vm_1.Values.make_record_from_map(__classPrivateFieldGet(this, _universe), x);
    }
    interpolation(xs) {
        return vm_1.Values.make_interpolation(__classPrivateFieldGet(this, _universe), xs);
    }
    concat_interpolation(x, y) {
        vm_1.Values.assert_tag(vm_1.Tag.INTERPOLATION, x);
        vm_1.Values.assert_tag(vm_1.Tag.INTERPOLATION, y);
        return vm_1.Values.make_interpolation(__classPrivateFieldGet(this, _universe), x.payload.concat(y.payload));
    }
    cell(x) {
        return vm_1.Values.make_cell(__classPrivateFieldGet(this, _universe), x);
    }
    get nothing() {
        return vm_1.Values.get_nothing(__classPrivateFieldGet(this, _universe));
    }
    get true() {
        return vm_1.Values.get_true(__classPrivateFieldGet(this, _universe));
    }
    get false() {
        return vm_1.Values.get_false(__classPrivateFieldGet(this, _universe));
    }
    invoke(name, args) {
        return new vm_1.NSInvoke(name, args);
    }
    apply(fn, args) {
        return new vm_1.NSApply(fn, args);
    }
    await(value) {
        return new vm_1.NSAwait(value);
    }
    run_synchronous(fn) {
        const env = new vm_1.Environment(null, null, __classPrivateFieldGet(this, _module), null);
        return vm_1.run_native_sync(__classPrivateFieldGet(this, _universe), env, __classPrivateFieldGet(this, _package), fn());
    }
    // == Destructors
    integer_to_bigint(x) {
        vm_1.Values.assert_tag(vm_1.Tag.INTEGER, x);
        return x.payload;
    }
    float_to_number(x) {
        vm_1.Values.assert_tag(vm_1.Tag.FLOAT_64, x);
        return x.payload;
    }
    to_js_boolean(x) {
        return vm_1.Values.get_boolean(x);
    }
    text_to_string(x) {
        return vm_1.Values.text_to_string(x);
    }
    tuple_to_array(x) {
        return vm_1.Values.get_array(x);
    }
    interpolation_to_parts(x) {
        return vm_1.Values.get_interpolation_parts(x);
    }
    normalise_interpolation(x) {
        return vm_1.Values.normalise_interpolation(__classPrivateFieldGet(this, _universe), x);
    }
    deref_cell(x) {
        return vm_1.Values.deref_cell(x);
    }
    update_cell(x, old_value, value) {
        return vm_1.Values.update_cell(x, old_value, value);
    }
    record_to_map(x) {
        return vm_1.Values.get_map(x);
    }
    action_choice(x) {
        const choice = vm_1.Values.get_action_choice(x);
        return {
            score: choice.score,
            action: vm_1.Values.make_action(choice.action, choice.env),
        };
    }
    unbox(x) {
        return vm_1.Values.unbox(x);
    }
    // == Operations
    intrinsic_equals(x, y) {
        return vm_1.Values.equals(x, y);
    }
    panic(tag, message) {
        throw new vm_1.ErrNativePanic(tag, message);
    }
    // == Tests
    is_crochet_value(x) {
        return x instanceof vm_1.CrochetValue;
    }
    is_interpolation(x) {
        return x.tag === vm_1.Tag.INTERPOLATION;
    }
    is_tuple(x) {
        return x.tag === vm_1.Tag.TUPLE;
    }
    is_thunk_forced(x) {
        return vm_1.Values.is_thunk_forced(x);
    }
    // == Conversions
    to_plain_native(x) {
        return vm_1.Values.to_plain_object(x);
    }
    from_plain_native(x) {
        return vm_1.Values.from_plain_object(__classPrivateFieldGet(this, _universe), x);
    }
    // == Reflection
    type_name(x) {
        return vm_1.Location.type_name(x.type);
    }
    to_debug_string(x) {
        return vm_1.Location.simple_value(x);
    }
    lookup_type(name) {
        return __classPrivateFieldGet(this, _module).types.try_lookup(name);
    }
    lookup_type_namespaced(namespace, name) {
        return __classPrivateFieldGet(this, _module).types.try_lookup_namespaced(namespace, name);
    }
    instantiate(type, args) {
        return vm_1.Values.instantiate(type, args);
    }
    // == Etc
    xorshift(seed, inc) {
        return new xorshift_1.XorShift(seed, inc);
    }
    xorshift_random() {
        return xorshift_1.XorShift.new_random();
    }
}
exports.ForeignInterface = ForeignInterface;
_universe = new WeakMap(), _package = new WeakMap(), _module = new WeakMap();

},{"../utils/xorshift":29,"../vm":33}],7:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./foreign"), exports);
__exportStar(require("./crochet"), exports);

},{"./crochet":5,"./foreign":6}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EffectCase = exports.DEffect = exports.DForeignType = exports.DContext = exports.DWhen = exports.DAction = exports.DRelation = exports.RelationType = exports.RelationMultiplicity = exports.DPrelude = exports.DOpen = exports.DDefine = exports.DTest = exports.DSeal = exports.DType = exports.DCommand = exports.Visibility = exports.DeclarationTag = void 0;
var DeclarationTag;
(function (DeclarationTag) {
    DeclarationTag[DeclarationTag["COMMAND"] = 1] = "COMMAND";
    DeclarationTag[DeclarationTag["TYPE"] = 2] = "TYPE";
    DeclarationTag[DeclarationTag["SEAL"] = 3] = "SEAL";
    DeclarationTag[DeclarationTag["TEST"] = 4] = "TEST";
    DeclarationTag[DeclarationTag["OPEN"] = 5] = "OPEN";
    DeclarationTag[DeclarationTag["DEFINE"] = 6] = "DEFINE";
    DeclarationTag[DeclarationTag["PRELUDE"] = 7] = "PRELUDE";
    DeclarationTag[DeclarationTag["RELATION"] = 8] = "RELATION";
    DeclarationTag[DeclarationTag["ACTION"] = 9] = "ACTION";
    DeclarationTag[DeclarationTag["WHEN"] = 10] = "WHEN";
    DeclarationTag[DeclarationTag["CONTEXT"] = 11] = "CONTEXT";
    DeclarationTag[DeclarationTag["FOREIGN_TYPE"] = 12] = "FOREIGN_TYPE";
    DeclarationTag[DeclarationTag["EFFECT"] = 13] = "EFFECT";
})(DeclarationTag = exports.DeclarationTag || (exports.DeclarationTag = {}));
var Visibility;
(function (Visibility) {
    Visibility[Visibility["LOCAL"] = 0] = "LOCAL";
    Visibility[Visibility["GLOBAL"] = 1] = "GLOBAL";
})(Visibility = exports.Visibility || (exports.Visibility = {}));
class BaseDeclaration {
}
class DCommand extends BaseDeclaration {
    constructor(meta, documentation, name, parameters, types, body) {
        super();
        this.meta = meta;
        this.documentation = documentation;
        this.name = name;
        this.parameters = parameters;
        this.types = types;
        this.body = body;
        this.tag = DeclarationTag.COMMAND;
    }
}
exports.DCommand = DCommand;
class DType extends BaseDeclaration {
    constructor(meta, documentation, visibility, name, parent, fields, types) {
        super();
        this.meta = meta;
        this.documentation = documentation;
        this.visibility = visibility;
        this.name = name;
        this.parent = parent;
        this.fields = fields;
        this.types = types;
        this.tag = DeclarationTag.TYPE;
    }
}
exports.DType = DType;
class DSeal extends BaseDeclaration {
    constructor(meta, name) {
        super();
        this.meta = meta;
        this.name = name;
        this.tag = DeclarationTag.SEAL;
    }
}
exports.DSeal = DSeal;
class DTest extends BaseDeclaration {
    constructor(meta, name, body) {
        super();
        this.meta = meta;
        this.name = name;
        this.body = body;
        this.tag = DeclarationTag.TEST;
    }
}
exports.DTest = DTest;
class DDefine extends BaseDeclaration {
    constructor(meta, documentation, visibility, name, body) {
        super();
        this.meta = meta;
        this.documentation = documentation;
        this.visibility = visibility;
        this.name = name;
        this.body = body;
        this.tag = DeclarationTag.DEFINE;
    }
}
exports.DDefine = DDefine;
class DOpen extends BaseDeclaration {
    constructor(meta, namespace) {
        super();
        this.meta = meta;
        this.namespace = namespace;
        this.tag = DeclarationTag.OPEN;
    }
}
exports.DOpen = DOpen;
class DPrelude extends BaseDeclaration {
    constructor(meta, body) {
        super();
        this.meta = meta;
        this.body = body;
        this.tag = DeclarationTag.PRELUDE;
    }
}
exports.DPrelude = DPrelude;
var RelationMultiplicity;
(function (RelationMultiplicity) {
    RelationMultiplicity[RelationMultiplicity["ONE"] = 1] = "ONE";
    RelationMultiplicity[RelationMultiplicity["MANY"] = 2] = "MANY";
})(RelationMultiplicity = exports.RelationMultiplicity || (exports.RelationMultiplicity = {}));
class RelationType {
    constructor(meta, multiplicity) {
        this.meta = meta;
        this.multiplicity = multiplicity;
    }
}
exports.RelationType = RelationType;
class DRelation extends BaseDeclaration {
    constructor(meta, documentation, name, type) {
        super();
        this.meta = meta;
        this.documentation = documentation;
        this.name = name;
        this.type = type;
        this.tag = DeclarationTag.RELATION;
    }
}
exports.DRelation = DRelation;
class DAction extends BaseDeclaration {
    constructor(meta, documentation, context, name, actor, parameter, rank_function, predicate, body) {
        super();
        this.meta = meta;
        this.documentation = documentation;
        this.context = context;
        this.name = name;
        this.actor = actor;
        this.parameter = parameter;
        this.rank_function = rank_function;
        this.predicate = predicate;
        this.body = body;
        this.tag = DeclarationTag.ACTION;
    }
}
exports.DAction = DAction;
class DWhen extends BaseDeclaration {
    constructor(meta, documentation, context, predicate, body) {
        super();
        this.meta = meta;
        this.documentation = documentation;
        this.context = context;
        this.predicate = predicate;
        this.body = body;
        this.tag = DeclarationTag.WHEN;
    }
}
exports.DWhen = DWhen;
class DContext extends BaseDeclaration {
    constructor(meta, documentation, name) {
        super();
        this.meta = meta;
        this.documentation = documentation;
        this.name = name;
        this.tag = DeclarationTag.CONTEXT;
    }
}
exports.DContext = DContext;
class DForeignType extends BaseDeclaration {
    constructor(meta, documentation, visibility, name, target) {
        super();
        this.meta = meta;
        this.documentation = documentation;
        this.visibility = visibility;
        this.name = name;
        this.target = target;
        this.tag = DeclarationTag.FOREIGN_TYPE;
    }
}
exports.DForeignType = DForeignType;
class DEffect extends BaseDeclaration {
    constructor(meta, documentation, name, cases) {
        super();
        this.meta = meta;
        this.documentation = documentation;
        this.name = name;
        this.cases = cases;
        this.tag = DeclarationTag.EFFECT;
    }
}
exports.DEffect = DEffect;
class EffectCase {
    constructor(meta, documentation, name, parameters, types) {
        this.meta = meta;
        this.documentation = documentation;
        this.name = name;
        this.parameters = parameters;
        this.types = types;
    }
}
exports.EffectCase = EffectCase;

},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DslAstInterpolation = exports.DslAstExpression = exports.DslAstNodeList = exports.DslAstVariable = exports.DslAstLiteral = exports.DslAstNode = exports.DslNodeTag = exports.Dsl = exports.ContinueWith = exports.Perform = exports.HandlerCase = exports.Handle = exports.Simulate = exports.SimulationSignal = exports.Forget = exports.Fact = exports.MatchSearch = exports.Search = exports.RegisterInstance = exports.IntrinsicEqual = exports.TypeTest = exports.Branch = exports.Assert = exports.PushPartial = exports.Return = exports.Apply = exports.Invoke = exports.InvokeForeign = exports.PushLambda = exports.Interpolate = exports.Force = exports.PushLazy = exports.ProjectStatic = exports.Project = exports.RecordAtPut = exports.PushRecord = exports.PushStaticType = exports.PushNew = exports.PushTuple = exports.PushReturn = exports.PushLiteral = exports.PushGlobal = exports.PushSelf = exports.PushVariable = exports.Let = exports.Drop = exports.BaseOp = exports.BasicBlock = exports.AssertType = exports.OpTag = void 0;
exports.DslInterpolationDynamic = exports.DslInterpolationStatic = exports.DslInterpolationTag = void 0;
var OpTag;
(function (OpTag) {
    OpTag[OpTag["DROP"] = 1] = "DROP";
    OpTag[OpTag["LET"] = 2] = "LET";
    OpTag[OpTag["PUSH_VARIABLE"] = 3] = "PUSH_VARIABLE";
    OpTag[OpTag["PUSH_SELF"] = 4] = "PUSH_SELF";
    OpTag[OpTag["PUSH_GLOBAL"] = 5] = "PUSH_GLOBAL";
    OpTag[OpTag["PUSH_LITERAL"] = 6] = "PUSH_LITERAL";
    OpTag[OpTag["PUSH_RETURN"] = 7] = "PUSH_RETURN";
    OpTag[OpTag["PUSH_TUPLE"] = 8] = "PUSH_TUPLE";
    OpTag[OpTag["PUSH_NEW"] = 9] = "PUSH_NEW";
    OpTag[OpTag["PUSH_STATIC_TYPE"] = 10] = "PUSH_STATIC_TYPE";
    OpTag[OpTag["PUSH_RECORD"] = 11] = "PUSH_RECORD";
    OpTag[OpTag["RECORD_AT_PUT"] = 12] = "RECORD_AT_PUT";
    OpTag[OpTag["PROJECT"] = 13] = "PROJECT";
    OpTag[OpTag["PROJECT_STATIC"] = 14] = "PROJECT_STATIC";
    OpTag[OpTag["INTERPOLATE"] = 15] = "INTERPOLATE";
    OpTag[OpTag["PUSH_LAZY"] = 16] = "PUSH_LAZY";
    OpTag[OpTag["FORCE"] = 17] = "FORCE";
    OpTag[OpTag["PUSH_LAMBDA"] = 18] = "PUSH_LAMBDA";
    OpTag[OpTag["INVOKE_FOREIGN"] = 19] = "INVOKE_FOREIGN";
    OpTag[OpTag["INVOKE"] = 20] = "INVOKE";
    OpTag[OpTag["APPLY"] = 21] = "APPLY";
    OpTag[OpTag["RETURN"] = 22] = "RETURN";
    OpTag[OpTag["PUSH_PARTIAL"] = 23] = "PUSH_PARTIAL";
    OpTag[OpTag["ASSERT"] = 24] = "ASSERT";
    OpTag[OpTag["BRANCH"] = 25] = "BRANCH";
    OpTag[OpTag["TYPE_TEST"] = 26] = "TYPE_TEST";
    OpTag[OpTag["INTRINSIC_EQUAL"] = 27] = "INTRINSIC_EQUAL";
    OpTag[OpTag["REGISTER_INSTANCE"] = 28] = "REGISTER_INSTANCE";
    OpTag[OpTag["SEARCH"] = 29] = "SEARCH";
    OpTag[OpTag["MATCH_SEARCH"] = 30] = "MATCH_SEARCH";
    OpTag[OpTag["FACT"] = 31] = "FACT";
    OpTag[OpTag["FORGET"] = 32] = "FORGET";
    OpTag[OpTag["SIMULATE"] = 33] = "SIMULATE";
    OpTag[OpTag["HANDLE"] = 34] = "HANDLE";
    OpTag[OpTag["PERFORM"] = 35] = "PERFORM";
    OpTag[OpTag["CONTINUE_WITH"] = 36] = "CONTINUE_WITH";
    OpTag[OpTag["DSL"] = 37] = "DSL";
})(OpTag = exports.OpTag || (exports.OpTag = {}));
var AssertType;
(function (AssertType) {
    AssertType[AssertType["PRECONDITION"] = 1] = "PRECONDITION";
    AssertType[AssertType["POSTCONDITION"] = 2] = "POSTCONDITION";
    AssertType[AssertType["RETURN_TYPE"] = 3] = "RETURN_TYPE";
    AssertType[AssertType["ASSERT"] = 4] = "ASSERT";
    AssertType[AssertType["UNREACHABLE"] = 5] = "UNREACHABLE";
})(AssertType = exports.AssertType || (exports.AssertType = {}));
class BasicBlock {
    constructor(ops) {
        this.ops = ops;
    }
}
exports.BasicBlock = BasicBlock;
class BaseOp {
}
exports.BaseOp = BaseOp;
class Drop extends BaseOp {
    constructor(meta) {
        super();
        this.meta = meta;
        this.tag = OpTag.DROP;
    }
}
exports.Drop = Drop;
class Let extends BaseOp {
    constructor(meta, name) {
        super();
        this.meta = meta;
        this.name = name;
        this.tag = OpTag.LET;
    }
}
exports.Let = Let;
class PushVariable extends BaseOp {
    constructor(meta, name) {
        super();
        this.meta = meta;
        this.name = name;
        this.tag = OpTag.PUSH_VARIABLE;
    }
}
exports.PushVariable = PushVariable;
class PushSelf extends BaseOp {
    constructor(meta) {
        super();
        this.meta = meta;
        this.tag = OpTag.PUSH_SELF;
    }
}
exports.PushSelf = PushSelf;
class PushGlobal extends BaseOp {
    constructor(meta, name) {
        super();
        this.meta = meta;
        this.name = name;
        this.tag = OpTag.PUSH_GLOBAL;
    }
}
exports.PushGlobal = PushGlobal;
class PushLiteral extends BaseOp {
    constructor(value) {
        super();
        this.value = value;
        this.tag = OpTag.PUSH_LITERAL;
        this.meta = null;
    }
}
exports.PushLiteral = PushLiteral;
class PushReturn extends BaseOp {
    constructor(meta) {
        super();
        this.meta = meta;
        this.tag = OpTag.PUSH_RETURN;
    }
}
exports.PushReturn = PushReturn;
class PushTuple extends BaseOp {
    constructor(meta, arity) {
        super();
        this.meta = meta;
        this.arity = arity;
        this.tag = OpTag.PUSH_TUPLE;
    }
}
exports.PushTuple = PushTuple;
class PushNew extends BaseOp {
    constructor(meta, type, arity) {
        super();
        this.meta = meta;
        this.type = type;
        this.arity = arity;
        this.tag = OpTag.PUSH_NEW;
    }
}
exports.PushNew = PushNew;
class PushStaticType extends BaseOp {
    constructor(meta, type) {
        super();
        this.meta = meta;
        this.type = type;
        this.tag = OpTag.PUSH_STATIC_TYPE;
    }
}
exports.PushStaticType = PushStaticType;
class PushRecord extends BaseOp {
    constructor(meta, keys) {
        super();
        this.meta = meta;
        this.keys = keys;
        this.tag = OpTag.PUSH_RECORD;
    }
}
exports.PushRecord = PushRecord;
class RecordAtPut extends BaseOp {
    constructor(meta) {
        super();
        this.meta = meta;
        this.tag = OpTag.RECORD_AT_PUT;
    }
}
exports.RecordAtPut = RecordAtPut;
class Project extends BaseOp {
    constructor(meta) {
        super();
        this.meta = meta;
        this.tag = OpTag.PROJECT;
    }
}
exports.Project = Project;
class ProjectStatic extends BaseOp {
    constructor(meta, key) {
        super();
        this.meta = meta;
        this.key = key;
        this.tag = OpTag.PROJECT_STATIC;
    }
}
exports.ProjectStatic = ProjectStatic;
class PushLazy extends BaseOp {
    constructor(meta, body) {
        super();
        this.meta = meta;
        this.body = body;
        this.tag = OpTag.PUSH_LAZY;
    }
}
exports.PushLazy = PushLazy;
class Force extends BaseOp {
    constructor(meta) {
        super();
        this.meta = meta;
        this.tag = OpTag.FORCE;
    }
}
exports.Force = Force;
class Interpolate extends BaseOp {
    constructor(meta, parts) {
        super();
        this.meta = meta;
        this.parts = parts;
        this.tag = OpTag.INTERPOLATE;
    }
}
exports.Interpolate = Interpolate;
class PushLambda extends BaseOp {
    constructor(meta, parameters, body) {
        super();
        this.meta = meta;
        this.parameters = parameters;
        this.body = body;
        this.tag = OpTag.PUSH_LAMBDA;
    }
}
exports.PushLambda = PushLambda;
class InvokeForeign extends BaseOp {
    constructor(meta, name, arity) {
        super();
        this.meta = meta;
        this.name = name;
        this.arity = arity;
        this.tag = OpTag.INVOKE_FOREIGN;
    }
}
exports.InvokeForeign = InvokeForeign;
class Invoke extends BaseOp {
    constructor(meta, name, arity) {
        super();
        this.meta = meta;
        this.name = name;
        this.arity = arity;
        this.tag = OpTag.INVOKE;
    }
}
exports.Invoke = Invoke;
class Apply extends BaseOp {
    constructor(meta, arity) {
        super();
        this.meta = meta;
        this.arity = arity;
        this.tag = OpTag.APPLY;
    }
}
exports.Apply = Apply;
class Return extends BaseOp {
    constructor(meta) {
        super();
        this.meta = meta;
        this.tag = OpTag.RETURN;
    }
}
exports.Return = Return;
class PushPartial extends BaseOp {
    constructor(meta, name, arity) {
        super();
        this.meta = meta;
        this.name = name;
        this.arity = arity;
        this.tag = OpTag.PUSH_PARTIAL;
    }
}
exports.PushPartial = PushPartial;
class Assert extends BaseOp {
    constructor(meta, kind, assert_tag, message, expression) {
        super();
        this.meta = meta;
        this.kind = kind;
        this.assert_tag = assert_tag;
        this.message = message;
        this.expression = expression;
        this.tag = OpTag.ASSERT;
    }
}
exports.Assert = Assert;
class Branch extends BaseOp {
    constructor(meta, consequent, alternate) {
        super();
        this.meta = meta;
        this.consequent = consequent;
        this.alternate = alternate;
        this.tag = OpTag.BRANCH;
    }
}
exports.Branch = Branch;
class TypeTest extends BaseOp {
    constructor(meta, type) {
        super();
        this.meta = meta;
        this.type = type;
        this.tag = OpTag.TYPE_TEST;
    }
}
exports.TypeTest = TypeTest;
class IntrinsicEqual extends BaseOp {
    constructor(meta) {
        super();
        this.meta = meta;
        this.tag = OpTag.INTRINSIC_EQUAL;
    }
}
exports.IntrinsicEqual = IntrinsicEqual;
class RegisterInstance extends BaseOp {
    constructor(meta) {
        super();
        this.meta = meta;
        this.tag = OpTag.REGISTER_INSTANCE;
    }
}
exports.RegisterInstance = RegisterInstance;
class Search extends BaseOp {
    constructor(meta, predicate) {
        super();
        this.meta = meta;
        this.predicate = predicate;
        this.tag = OpTag.SEARCH;
    }
}
exports.Search = Search;
class MatchSearch extends BaseOp {
    constructor(meta, block, alternate) {
        super();
        this.meta = meta;
        this.block = block;
        this.alternate = alternate;
        this.tag = OpTag.MATCH_SEARCH;
    }
}
exports.MatchSearch = MatchSearch;
class Fact extends BaseOp {
    constructor(meta, relation, arity) {
        super();
        this.meta = meta;
        this.relation = relation;
        this.arity = arity;
        this.tag = OpTag.FACT;
    }
}
exports.Fact = Fact;
class Forget extends BaseOp {
    constructor(meta, relation, arity) {
        super();
        this.meta = meta;
        this.relation = relation;
        this.arity = arity;
        this.tag = OpTag.FORGET;
    }
}
exports.Forget = Forget;
class SimulationSignal {
    constructor(meta, parameters, name, body) {
        this.meta = meta;
        this.parameters = parameters;
        this.name = name;
        this.body = body;
    }
}
exports.SimulationSignal = SimulationSignal;
class Simulate extends BaseOp {
    constructor(meta, context, goal, signals) {
        super();
        this.meta = meta;
        this.context = context;
        this.goal = goal;
        this.signals = signals;
        this.tag = OpTag.SIMULATE;
    }
}
exports.Simulate = Simulate;
class Handle extends BaseOp {
    constructor(meta, body, handlers) {
        super();
        this.meta = meta;
        this.body = body;
        this.handlers = handlers;
        this.tag = OpTag.HANDLE;
    }
}
exports.Handle = Handle;
class HandlerCase {
    constructor(meta, effect, variant, parameters, block) {
        this.meta = meta;
        this.effect = effect;
        this.variant = variant;
        this.parameters = parameters;
        this.block = block;
    }
}
exports.HandlerCase = HandlerCase;
class Perform extends BaseOp {
    constructor(meta, effect, variant, arity) {
        super();
        this.meta = meta;
        this.effect = effect;
        this.variant = variant;
        this.arity = arity;
        this.tag = OpTag.PERFORM;
    }
}
exports.Perform = Perform;
class ContinueWith extends BaseOp {
    constructor(meta) {
        super();
        this.meta = meta;
        this.tag = OpTag.CONTINUE_WITH;
    }
}
exports.ContinueWith = ContinueWith;
class Dsl extends BaseOp {
    constructor(meta, type, ast) {
        super();
        this.meta = meta;
        this.type = type;
        this.ast = ast;
        this.tag = OpTag.DSL;
    }
}
exports.Dsl = Dsl;
var DslNodeTag;
(function (DslNodeTag) {
    DslNodeTag[DslNodeTag["NODE"] = 1] = "NODE";
    DslNodeTag[DslNodeTag["LITERAL"] = 2] = "LITERAL";
    DslNodeTag[DslNodeTag["VARIABLE"] = 3] = "VARIABLE";
    DslNodeTag[DslNodeTag["LIST"] = 4] = "LIST";
    DslNodeTag[DslNodeTag["INTERPOLATION"] = 5] = "INTERPOLATION";
    DslNodeTag[DslNodeTag["EXPRESSION"] = 6] = "EXPRESSION";
})(DslNodeTag = exports.DslNodeTag || (exports.DslNodeTag = {}));
class DslAstNode {
    constructor(meta, name, children, attributes) {
        this.meta = meta;
        this.name = name;
        this.children = children;
        this.attributes = attributes;
        this.tag = DslNodeTag.NODE;
    }
}
exports.DslAstNode = DslAstNode;
class DslAstLiteral {
    constructor(meta, value) {
        this.meta = meta;
        this.value = value;
        this.tag = DslNodeTag.LITERAL;
    }
}
exports.DslAstLiteral = DslAstLiteral;
class DslAstVariable {
    constructor(meta, name) {
        this.meta = meta;
        this.name = name;
        this.tag = DslNodeTag.VARIABLE;
    }
}
exports.DslAstVariable = DslAstVariable;
class DslAstNodeList {
    constructor(meta, children) {
        this.meta = meta;
        this.children = children;
        this.tag = DslNodeTag.LIST;
    }
}
exports.DslAstNodeList = DslAstNodeList;
class DslAstExpression {
    constructor(meta, source, value) {
        this.meta = meta;
        this.source = source;
        this.value = value;
        this.tag = DslNodeTag.EXPRESSION;
    }
}
exports.DslAstExpression = DslAstExpression;
class DslAstInterpolation {
    constructor(meta, parts) {
        this.meta = meta;
        this.parts = parts;
        this.tag = DslNodeTag.INTERPOLATION;
    }
}
exports.DslAstInterpolation = DslAstInterpolation;
var DslInterpolationTag;
(function (DslInterpolationTag) {
    DslInterpolationTag[DslInterpolationTag["STATIC"] = 0] = "STATIC";
    DslInterpolationTag[DslInterpolationTag["DYNAMIC"] = 1] = "DYNAMIC";
})(DslInterpolationTag = exports.DslInterpolationTag || (exports.DslInterpolationTag = {}));
class DslInterpolationStatic {
    constructor(text) {
        this.text = text;
        this.tag = DslInterpolationTag.STATIC;
    }
}
exports.DslInterpolationStatic = DslInterpolationStatic;
class DslInterpolationDynamic {
    constructor(node) {
        this.node = node;
        this.tag = DslInterpolationTag.DYNAMIC;
    }
}
exports.DslInterpolationDynamic = DslInterpolationDynamic;

},{}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SGPredicate = exports.SGTotalQuiescence = exports.SGEventQuiescence = exports.SGActionQuiescence = exports.SimulationGoalBase = exports.SimulationGoalTag = void 0;
var SimulationGoalTag;
(function (SimulationGoalTag) {
    SimulationGoalTag[SimulationGoalTag["ACTION_QUIESCENCE"] = 1] = "ACTION_QUIESCENCE";
    SimulationGoalTag[SimulationGoalTag["EVENT_QUIESCENCE"] = 2] = "EVENT_QUIESCENCE";
    SimulationGoalTag[SimulationGoalTag["TOTAL_QUIESCENCE"] = 3] = "TOTAL_QUIESCENCE";
    SimulationGoalTag[SimulationGoalTag["PREDICATE"] = 4] = "PREDICATE";
})(SimulationGoalTag = exports.SimulationGoalTag || (exports.SimulationGoalTag = {}));
class SimulationGoalBase {
}
exports.SimulationGoalBase = SimulationGoalBase;
class SGActionQuiescence extends SimulationGoalBase {
    constructor(meta) {
        super();
        this.meta = meta;
        this.tag = SimulationGoalTag.ACTION_QUIESCENCE;
    }
}
exports.SGActionQuiescence = SGActionQuiescence;
class SGEventQuiescence extends SimulationGoalBase {
    constructor(meta) {
        super();
        this.meta = meta;
        this.tag = SimulationGoalTag.EVENT_QUIESCENCE;
    }
}
exports.SGEventQuiescence = SGEventQuiescence;
class SGTotalQuiescence extends SimulationGoalBase {
    constructor(meta) {
        super();
        this.meta = meta;
        this.tag = SimulationGoalTag.TOTAL_QUIESCENCE;
    }
}
exports.SGTotalQuiescence = SGTotalQuiescence;
class SGPredicate extends SimulationGoalBase {
    constructor(meta, predicate) {
        super();
        this.meta = meta;
        this.predicate = predicate;
        this.tag = SimulationGoalTag.PREDICATE;
    }
}
exports.SGPredicate = SGPredicate;

},{}],11:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./meta"), exports);
__exportStar(require("./type"), exports);
__exportStar(require("./literal"), exports);
__exportStar(require("./pattern"), exports);
__exportStar(require("./logic"), exports);
__exportStar(require("./goal"), exports);
__exportStar(require("./expression"), exports);
__exportStar(require("./declaration"), exports);
__exportStar(require("./program"), exports);

},{"./declaration":8,"./expression":9,"./goal":10,"./literal":12,"./logic":13,"./meta":14,"./pattern":15,"./program":16,"./type":17}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiteralText = exports.LiteralFloat64 = exports.LiteralInteger = exports.LiteralFalse = exports.LiteralTrue = exports.LiteralNothing = exports.BaseLiteral = exports.LiteralTag = void 0;
var LiteralTag;
(function (LiteralTag) {
    LiteralTag[LiteralTag["NOTHING"] = 1] = "NOTHING";
    LiteralTag[LiteralTag["TRUE"] = 2] = "TRUE";
    LiteralTag[LiteralTag["FALSE"] = 3] = "FALSE";
    LiteralTag[LiteralTag["INTEGER"] = 4] = "INTEGER";
    LiteralTag[LiteralTag["FLOAT_64"] = 5] = "FLOAT_64";
    LiteralTag[LiteralTag["TEXT"] = 6] = "TEXT";
})(LiteralTag = exports.LiteralTag || (exports.LiteralTag = {}));
class BaseLiteral {
}
exports.BaseLiteral = BaseLiteral;
class LiteralNothing extends BaseLiteral {
    constructor() {
        super(...arguments);
        this.tag = LiteralTag.NOTHING;
    }
}
exports.LiteralNothing = LiteralNothing;
class LiteralTrue extends BaseLiteral {
    constructor() {
        super(...arguments);
        this.tag = LiteralTag.TRUE;
    }
}
exports.LiteralTrue = LiteralTrue;
class LiteralFalse extends BaseLiteral {
    constructor() {
        super(...arguments);
        this.tag = LiteralTag.FALSE;
    }
}
exports.LiteralFalse = LiteralFalse;
class LiteralInteger extends BaseLiteral {
    constructor(value) {
        super();
        this.value = value;
        this.tag = LiteralTag.INTEGER;
    }
}
exports.LiteralInteger = LiteralInteger;
class LiteralFloat64 extends BaseLiteral {
    constructor(value) {
        super();
        this.value = value;
        this.tag = LiteralTag.FLOAT_64;
    }
}
exports.LiteralFloat64 = LiteralFloat64;
class LiteralText extends BaseLiteral {
    constructor(value) {
        super();
        this.value = value;
        this.tag = LiteralTag.TEXT;
    }
}
exports.LiteralText = LiteralText;

},{}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAlways = exports.PType = exports.PLet = exports.PConstrained = exports.PSampleType = exports.PSampleRelation = exports.PRelation = exports.PNot = exports.POr = exports.PAnd = exports.PredicateBase = exports.PredicateTag = void 0;
var PredicateTag;
(function (PredicateTag) {
    PredicateTag[PredicateTag["AND"] = 0] = "AND";
    PredicateTag[PredicateTag["OR"] = 1] = "OR";
    PredicateTag[PredicateTag["NOT"] = 2] = "NOT";
    PredicateTag[PredicateTag["RELATION"] = 3] = "RELATION";
    PredicateTag[PredicateTag["SAMPLE_RELATION"] = 4] = "SAMPLE_RELATION";
    PredicateTag[PredicateTag["SAMPLE_TYPE"] = 5] = "SAMPLE_TYPE";
    PredicateTag[PredicateTag["CONSTRAIN"] = 6] = "CONSTRAIN";
    PredicateTag[PredicateTag["LET"] = 7] = "LET";
    PredicateTag[PredicateTag["TYPE"] = 8] = "TYPE";
    PredicateTag[PredicateTag["ALWAYS"] = 9] = "ALWAYS";
})(PredicateTag = exports.PredicateTag || (exports.PredicateTag = {}));
class PredicateBase {
}
exports.PredicateBase = PredicateBase;
class PAnd extends PredicateBase {
    constructor(meta, left, right) {
        super();
        this.meta = meta;
        this.left = left;
        this.right = right;
        this.tag = PredicateTag.AND;
    }
}
exports.PAnd = PAnd;
class POr extends PredicateBase {
    constructor(meta, left, right) {
        super();
        this.meta = meta;
        this.left = left;
        this.right = right;
        this.tag = PredicateTag.OR;
    }
}
exports.POr = POr;
class PNot extends PredicateBase {
    constructor(meta, pred) {
        super();
        this.meta = meta;
        this.pred = pred;
        this.tag = PredicateTag.NOT;
    }
}
exports.PNot = PNot;
class PRelation extends PredicateBase {
    constructor(meta, relation, patterns) {
        super();
        this.meta = meta;
        this.relation = relation;
        this.patterns = patterns;
        this.tag = PredicateTag.RELATION;
    }
}
exports.PRelation = PRelation;
class PSampleRelation extends PredicateBase {
    constructor(meta, size, relation, patterns) {
        super();
        this.meta = meta;
        this.size = size;
        this.relation = relation;
        this.patterns = patterns;
        this.tag = PredicateTag.SAMPLE_RELATION;
    }
}
exports.PSampleRelation = PSampleRelation;
class PSampleType extends PredicateBase {
    constructor(meta, size, name, type) {
        super();
        this.meta = meta;
        this.size = size;
        this.name = name;
        this.type = type;
        this.tag = PredicateTag.SAMPLE_TYPE;
    }
}
exports.PSampleType = PSampleType;
class PConstrained extends PredicateBase {
    constructor(meta, predicate, constraint) {
        super();
        this.meta = meta;
        this.predicate = predicate;
        this.constraint = constraint;
        this.tag = PredicateTag.CONSTRAIN;
    }
}
exports.PConstrained = PConstrained;
class PLet extends PredicateBase {
    constructor(meta, name, value) {
        super();
        this.meta = meta;
        this.name = name;
        this.value = value;
        this.tag = PredicateTag.LET;
    }
}
exports.PLet = PLet;
class PType extends PredicateBase {
    constructor(meta, name, type) {
        super();
        this.meta = meta;
        this.name = name;
        this.type = type;
        this.tag = PredicateTag.TYPE;
    }
}
exports.PType = PType;
class PAlways extends PredicateBase {
    constructor(meta) {
        super();
        this.meta = meta;
        this.tag = PredicateTag.ALWAYS;
    }
}
exports.PAlways = PAlways;

},{}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WildcardPattern = exports.VariablePattern = exports.SelfPattern = exports.GlobalPattern = exports.LiteralPattern = exports.TypePattern = exports.PatternBase = exports.PatternTag = void 0;
var PatternTag;
(function (PatternTag) {
    PatternTag[PatternTag["HAS_TYPE"] = 0] = "HAS_TYPE";
    PatternTag[PatternTag["GLOBAL"] = 1] = "GLOBAL";
    PatternTag[PatternTag["VARIABLE"] = 2] = "VARIABLE";
    PatternTag[PatternTag["SELF"] = 3] = "SELF";
    PatternTag[PatternTag["WILDCARD"] = 4] = "WILDCARD";
    PatternTag[PatternTag["LITERAL"] = 5] = "LITERAL";
})(PatternTag = exports.PatternTag || (exports.PatternTag = {}));
class PatternBase {
}
exports.PatternBase = PatternBase;
class TypePattern extends PatternBase {
    constructor(meta, type, pattern) {
        super();
        this.meta = meta;
        this.type = type;
        this.pattern = pattern;
        this.tag = PatternTag.HAS_TYPE;
    }
}
exports.TypePattern = TypePattern;
class LiteralPattern extends PatternBase {
    constructor(meta, literal) {
        super();
        this.meta = meta;
        this.literal = literal;
        this.tag = PatternTag.LITERAL;
    }
}
exports.LiteralPattern = LiteralPattern;
class GlobalPattern extends PatternBase {
    constructor(meta, name) {
        super();
        this.meta = meta;
        this.name = name;
        this.tag = PatternTag.GLOBAL;
    }
}
exports.GlobalPattern = GlobalPattern;
class SelfPattern extends PatternBase {
    constructor(meta) {
        super();
        this.meta = meta;
        this.tag = PatternTag.SELF;
    }
}
exports.SelfPattern = SelfPattern;
class VariablePattern extends PatternBase {
    constructor(meta, name) {
        super();
        this.meta = meta;
        this.name = name;
        this.tag = PatternTag.VARIABLE;
    }
}
exports.VariablePattern = VariablePattern;
class WildcardPattern extends PatternBase {
    constructor(meta) {
        super();
        this.meta = meta;
        this.tag = PatternTag.WILDCARD;
    }
}
exports.WildcardPattern = WildcardPattern;

},{}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Program = exports.Interval = void 0;
class Interval {
    constructor(range) {
        this.range = range;
    }
}
exports.Interval = Interval;
class Program {
    constructor(filename, source, meta_table, declarations) {
        this.filename = filename;
        this.source = source;
        this.meta_table = meta_table;
        this.declarations = declarations;
    }
}
exports.Program = Program;

},{}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalType = exports.GlobalType = exports.StaticType = exports.UnknownType = exports.AnyType = exports.BaseType = exports.TypeTag = void 0;
var TypeTag;
(function (TypeTag) {
    TypeTag[TypeTag["ANY"] = 1] = "ANY";
    TypeTag[TypeTag["UNKNOWN"] = 2] = "UNKNOWN";
    TypeTag[TypeTag["GLOBAL"] = 3] = "GLOBAL";
    TypeTag[TypeTag["LOCAL"] = 4] = "LOCAL";
    TypeTag[TypeTag["LOCAL_STATIC"] = 5] = "LOCAL_STATIC";
})(TypeTag = exports.TypeTag || (exports.TypeTag = {}));
class BaseType {
}
exports.BaseType = BaseType;
class AnyType extends BaseType {
    constructor() {
        super(...arguments);
        this.tag = TypeTag.ANY;
    }
}
exports.AnyType = AnyType;
class UnknownType extends BaseType {
    constructor() {
        super(...arguments);
        this.tag = TypeTag.UNKNOWN;
    }
}
exports.UnknownType = UnknownType;
class StaticType extends BaseType {
    constructor(meta, name) {
        super();
        this.meta = meta;
        this.name = name;
        this.tag = TypeTag.LOCAL_STATIC;
    }
}
exports.StaticType = StaticType;
class GlobalType extends BaseType {
    constructor(meta, namespace, name) {
        super();
        this.meta = meta;
        this.namespace = namespace;
        this.name = name;
        this.tag = TypeTag.GLOBAL;
    }
}
exports.GlobalType = GlobalType;
class LocalType extends BaseType {
    constructor(meta, name) {
        super();
        this.meta = meta;
        this.name = name;
        this.tag = TypeTag.LOCAL;
    }
}
exports.LocalType = LocalType;

},{}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.build_package_graph = exports.ResolvedPackage = exports.ResolvedFile = exports.PackageGraph = void 0;
const Path = require("path");
const ir_1 = require("./ir");
const logger_1 = require("../utils/logger");
const collections_1 = require("../utils/collections");
const ops_1 = require("./ops");
class PackageGraph {
    constructor(target, trusted, packages) {
        this.target = target;
        this.trusted = trusted;
        this.packages = packages;
    }
    get capability_requirements() {
        const capabilities = new Map();
        for (const pkg of this.packages.values()) {
            for (const cap of pkg.capabilities) {
                const xs = capabilities.get(cap) ?? [];
                xs.push(pkg);
                capabilities.set(cap, xs);
            }
        }
        return capabilities;
    }
    get capability_providers() {
        const providers = new Map();
        for (const pkg of this.packages.values()) {
            for (const cap of pkg.provided_capabilities) {
                const xs = providers.get(cap) ?? [];
                xs.push(pkg);
                providers.set(cap, xs);
            }
        }
        return providers;
    }
    get_package(name) {
        const pkg = this.packages.get(name);
        if (pkg == null) {
            throw new Error(`Package ${name} does not exist in the package graph.`);
        }
        return pkg;
    }
    parents(root) {
        const result = new Set();
        for (const pkg of this.packages.values()) {
            for (const dep of pkg.dependencies) {
                if (dep.name === root.name) {
                    result.add(pkg);
                }
            }
        }
        return [...result];
    }
    check_target(root) {
        logger_1.logger.debug(`Checking for target violations (target: ${ops_1.describe_target(this.target)})`);
        for (const pkg of this.serialise(root)) {
            logger_1.logger.debug(`  - ${pkg.name} has target: ${ops_1.describe_target(pkg.target)}`);
            if (!ops_1.target_compatible(this.target, pkg.target)) {
                const parents = this.parents(pkg)
                    .map((x) => x.name)
                    .join(", ");
                throw new Error([
                    `Cannot load package ${pkg.name} `,
                    `(included in ${parents}) `,
                    `for target ${ops_1.describe_target(this.target)} `,
                    `because it requires the target ${ops_1.describe_target(pkg.target)}`,
                ].join(""));
            }
        }
    }
    check_capabilities(root, capabilities) {
        const self = this;
        function native_allowed(pkg, capabilities) {
            return capabilities.has("native") || self.trusted.has(pkg.pkg);
        }
        function check(visited, parent, pkg, capabilities) {
            const name = pkg.name;
            // check missing capabilities
            const missing = [...ops_1.missing_capabilities(capabilities, pkg.capabilities)];
            if (missing.length !== 0) {
                throw new Error([
                    `${name} cannot be loaded from ${parent} `,
                    `because it does not have the capabilities: `,
                    missing.join(", "),
                    `\n`,
                    `${parent} has granted the capabilities: `,
                    [...capabilities].join(", "),
                ].join(""));
            }
            // check native capabilities
            if (pkg.native_sources.length !== 0 &&
                native_allowed(pkg, capabilities)) {
                throw new Error([
                    `${name} (${pkg.filename}) defines native extensions, `,
                    `but has not been granted the 'native' capability.\n`,
                    `${parent} has granted the capabilities: `,
                    [...capabilities].join(", "),
                ].join(""));
            }
            // check dependencies recursively
            for (const x of pkg.dependencies) {
                const dep = self.get_package(x.name);
                if (!visited.includes(dep)) {
                    const new_capabilities = ops_1.restrict_capabilities(capabilities, dep.capabilities);
                    check([dep, ...visited], name, dep, new_capabilities);
                }
            }
        }
        logger_1.logger.debug([
            `Checking for capability violations `,
            `(capabilities: ${[...capabilities].join(", ")})`,
        ].join(""));
        for (const [k, v] of this.packages.entries()) {
            logger_1.logger.debug(`  - ${k} requires: ${[...v.required_capabilities].join(", ")}`);
        }
        check([], `(root)`, root, capabilities);
    }
    check(root, capabilities) {
        this.check_target(root);
        this.check_capabilities(root, capabilities);
    }
    *serialise(root) {
        function* collect(pkg) {
            const include = !visited.has(pkg);
            visited.add(pkg);
            for (const x of pkg.dependencies) {
                const dep = self.get_package(x.name);
                if (!visited.has(dep)) {
                    yield* collect(dep);
                }
            }
            if (include) {
                yield pkg;
            }
        }
        const self = this;
        const visited = new Set();
        yield* collect(root);
    }
}
exports.PackageGraph = PackageGraph;
class ResolvedFile {
    constructor(pkg, file) {
        this.pkg = pkg;
        this.file = file;
    }
    with_basename(x) {
        const dir = Path.dirname(this.file.filename);
        return new ResolvedFile(this.pkg, ir_1.file({ filename: Path.join(dir, x), target: this.file.target }));
    }
    get basename() {
        return Path.basename(this.relative_filename);
    }
    get relative_filename() {
        return this.file.filename;
    }
    get relative_basename() {
        const dir = Path.dirname(this.relative_filename);
        const base = Path.basename(this.relative_filename, ".crochet");
        return Path.join(dir, base);
    }
    get absolute_directory() {
        return Path.dirname(this.absolute_filename);
    }
    get absolute_filename() {
        return Path.resolve(this.pkg.root, this.relative_filename);
    }
    get crochet_file() {
        if (this.is_crochet) {
            return this;
        }
        else {
            return new ResolvedFile(this.pkg, ir_1.file({
                filename: Path.join(this.file.filename + ".crochet"),
                target: this.file.target,
            }));
        }
    }
    get is_crochet() {
        return this.extension === ".crochet";
    }
    get binary_image() {
        return Path.join(this.pkg.binary_root, this.relative_basename + ".croc");
    }
    get extension() {
        return Path.extname(this.relative_filename);
    }
}
exports.ResolvedFile = ResolvedFile;
class ResolvedPackage {
    constructor(pkg, target) {
        this.pkg = pkg;
        this.target = target;
    }
    get name() {
        return this.pkg.meta.name;
    }
    get filename() {
        return this.pkg.filename;
    }
    get root() {
        return Path.dirname(this.filename);
    }
    get binary_root() {
        return Path.join(this.root, ".binary");
    }
    get dependencies() {
        return this.pkg.meta.dependencies.filter((x) => ops_1.target_compatible(this.target, x.target));
    }
    get sources() {
        return this.pkg.meta.sources
            .filter((x) => ops_1.target_compatible(this.target, x.target))
            .map((x) => new ResolvedFile(this, x));
    }
    get native_sources() {
        return this.pkg.meta.native_sources
            .filter((x) => ops_1.target_compatible(this.target, x.target))
            .map((x) => new ResolvedFile(this, x));
    }
    get required_capabilities() {
        return this.pkg.meta.capabilities.requires;
    }
    get provided_capabilities() {
        return this.pkg.meta.capabilities.provides;
    }
    get capabilities() {
        return collections_1.union(this.required_capabilities, this.provided_capabilities);
    }
}
exports.ResolvedPackage = ResolvedPackage;
async function build_package_graph(root, target, trusted, resolver) {
    async function resolve(pkg) {
        for (const dep of pkg.dependencies) {
            if (!packages.has(dep.name)) {
                logger_1.logger.debug(`Resolving package ${dep.name} from ${pkg.name}`);
                const dep_meta = await resolver.get_package(dep.name);
                if (dep.name !== dep_meta.meta.name) {
                    throw new Error(`${pkg.name} includes a dependency on ${dep.name}, but the loader returned the package ${dep.name}`);
                }
                const resolved_dep = new ResolvedPackage(dep_meta, target);
                packages.set(resolved_dep.name, resolved_dep);
                resolve(resolved_dep);
            }
        }
    }
    const packages = new Map();
    const resolved_pkg = new ResolvedPackage(root, target);
    packages.set(resolved_pkg.name, resolved_pkg);
    await resolve(resolved_pkg);
    return new PackageGraph(target, trusted, packages);
}
exports.build_package_graph = build_package_graph;

},{"../utils/collections":25,"../utils/logger":26,"./ir":20,"./ops":21,"path":81}],19:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./ir"), exports);
__exportStar(require("./parser"), exports);
__exportStar(require("./ops"), exports);
__exportStar(require("./graph"), exports);

},{"./graph":18,"./ir":20,"./ops":21,"./parser":22}],20:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.capabilities = exports.capability = exports.dependency = exports.target_web = exports.target_node = exports.target_any = exports.file = exports.pkg = exports.TargetTag = void 0;
var TargetTag;
(function (TargetTag) {
    TargetTag[TargetTag["ANY"] = 0] = "ANY";
    TargetTag[TargetTag["NODE"] = 1] = "NODE";
    TargetTag[TargetTag["WEB"] = 2] = "WEB";
})(TargetTag = exports.TargetTag || (exports.TargetTag = {}));
function pkg(filename, meta) {
    return { filename, meta };
}
exports.pkg = pkg;
function file(x) {
    return x;
}
exports.file = file;
function target_any() {
    return { tag: TargetTag.ANY };
}
exports.target_any = target_any;
function target_node() {
    return { tag: TargetTag.NODE };
}
exports.target_node = target_node;
function target_web() {
    return { tag: TargetTag.WEB };
}
exports.target_web = target_web;
function dependency(x) {
    return x;
}
exports.dependency = dependency;
function capability(x) {
    return x;
}
exports.capability = capability;
function capabilities(x) {
    return x;
}
exports.capabilities = capabilities;

},{}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrict_capabilities = exports.missing_capabilities = exports.describe_target = exports.target_compatible = void 0;
const collections_1 = require("../utils/collections");
const utils_1 = require("../utils/utils");
const ir_1 = require("./ir");
function target_compatible(self, that) {
    switch (self.tag) {
        case ir_1.TargetTag.ANY:
            return true;
        case ir_1.TargetTag.NODE:
            return that.tag === ir_1.TargetTag.NODE || that.tag === ir_1.TargetTag.ANY;
        case ir_1.TargetTag.WEB:
            return that.tag === ir_1.TargetTag.WEB || that.tag === ir_1.TargetTag.ANY;
        default:
            throw utils_1.unreachable(self, `Target`);
    }
}
exports.target_compatible = target_compatible;
function describe_target(x) {
    switch (x.tag) {
        case ir_1.TargetTag.ANY:
            return "*";
        case ir_1.TargetTag.NODE:
            return "node";
        case ir_1.TargetTag.WEB:
            return "web";
        default:
            throw utils_1.unreachable(x, "Target");
    }
}
exports.describe_target = describe_target;
function missing_capabilities(total, required) {
    return collections_1.difference(required, total);
}
exports.missing_capabilities = missing_capabilities;
function restrict_capabilities(current, required) {
    return collections_1.intersect(current, required);
}
exports.restrict_capabilities = restrict_capabilities;

},{"../utils/collections":25,"../utils/utils":28,"./ir":20}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse_from_string = exports.parse = exports.package_spec = exports.dependency_spec = exports.capabilities_spec = exports.capability_spec = exports.file_spec = exports.target_spec = void 0;
const ir_1 = require("./ir");
const spec_1 = require("../utils/spec");
const Spec = require("../utils/spec");
function set(x) {
    return spec_1.map_spec(spec_1.array(x), (xs) => new Set(xs));
}
exports.target_spec = spec_1.anyOf([
    spec_1.map_spec(spec_1.equal("*"), () => ir_1.target_any()),
    spec_1.map_spec(spec_1.equal("node"), () => ir_1.target_node()),
    spec_1.map_spec(spec_1.equal("browser"), () => ir_1.target_web()),
]);
exports.file_spec = spec_1.anyOf([
    spec_1.map_spec(spec_1.string, (x) => ir_1.file({ filename: x, target: ir_1.target_any() })),
    spec_1.spec({
        filename: spec_1.string,
        target: exports.target_spec,
    }, (x) => ir_1.file(x)),
]);
exports.capability_spec = spec_1.map_spec(spec_1.string, ir_1.capability);
exports.capabilities_spec = spec_1.spec({
    requires: set(exports.capability_spec),
    provides: set(exports.capability_spec),
}, (x) => ir_1.capabilities(x));
exports.dependency_spec = spec_1.anyOf([
    spec_1.map_spec(spec_1.string, (x) => ir_1.dependency({
        name: x,
        capabilities: new Set(),
        target: ir_1.target_any(),
    })),
    spec_1.spec({
        name: spec_1.string,
        capabilities: spec_1.optional(set(exports.capability_spec), new Set()),
        target: spec_1.optional(exports.target_spec, ir_1.target_any()),
    }, (x) => ir_1.dependency(x)),
]);
exports.package_spec = spec_1.spec({
    name: spec_1.string,
    target: spec_1.optional(exports.target_spec, ir_1.target_any()),
    sources: spec_1.array(exports.file_spec),
    native_sources: spec_1.optional(spec_1.array(exports.file_spec), []),
    dependencies: spec_1.optional(spec_1.array(exports.dependency_spec), []),
    capabilities: spec_1.optional(exports.capabilities_spec, ir_1.capabilities({
        requires: new Set(),
        provides: new Set(),
    })),
}, (x) => (filename) => ir_1.pkg(filename, x));
function parse(x, filename) {
    const result = Spec.try_parse(x, exports.package_spec);
    if (result instanceof Spec.Ok) {
        return result.value(filename);
    }
    else {
        throw new Error(`Could not read the package at ${filename}:\n  - ${result.reason.format()}`);
    }
}
exports.parse = parse;
function parse_from_string(x, filename) {
    return parse(JSON.parse(x), filename);
}
exports.parse_from_string = parse_from_string;

},{"../utils/spec":27,"./ir":20}],23:[function(require,module,exports){
(function (Buffer){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrochetForBrowser = void 0;
const Package = require("../../pkg");
const crochet_1 = require("../../crochet");
class CrochetForBrowser {
    constructor(library_base, capabilities, interactive) {
        this.library_base = library_base;
        this.capabilities = capabilities;
        this.interactive = interactive;
        this._booted_system = null;
        this._root = null;
        this._ffi = null;
        this.fs = {
            read_package: async (name) => {
                const filename = this.package_url(name);
                const response = await fetch(filename);
                const data = await response.json();
                return Package.parse(data, filename);
            },
            read_file: async (file) => {
                const response = await fetch(file);
                return await response.text();
            },
            read_binary: async (file, pkg) => {
                const response = await fetch(file.binary_image);
                const data = await response.arrayBuffer();
                const buffer = Buffer.from(data);
                return buffer;
            },
            read_native_module: async (file, pkg) => {
                const response = await fetch(file.absolute_filename);
                const source = await response.text();
                const exports = Object.create(null);
                const fn = new Function("exports", source);
                fn(exports);
                if (typeof exports.default === "function") {
                    return exports.default;
                }
                else {
                    throw new Error([
                        `Native module ${file.relative_filename} in ${pkg.name} `,
                        `does not expose a function in 'exports.default'.`,
                    ].join(""));
                }
            },
        };
        this.signal = {
            request_capabilities: async (graph, root) => {
                const requirements = new Set(graph.capability_requirements.keys());
                return (Package.missing_capabilities(this.capabilities, requirements).size === 0);
                // TODO: implement capability granting
            },
        };
        this.crochet = new crochet_1.Crochet(this.fs, this.signal);
    }
    get trusted_core() {
        return new Set(["crochet.core", "crochet.debug"]);
    }
    get system() {
        if (this._booted_system == null) {
            throw new Error(`Crochet not yet booted`);
        }
        return this._booted_system;
    }
    get root() {
        if (this._root == null) {
            throw new Error(`Crochet not yet booted`);
        }
        return this._root;
    }
    get ffi() {
        if (this._ffi == null) {
            throw new Error(`Crochet not yet booted`);
        }
        return this._ffi;
    }
    async boot_from_file(filename, target) {
        const source = await this.fs.read_file(filename);
        const pkg = Package.parse_from_string(source, filename);
        return this.boot(pkg, target);
    }
    async boot(entry, target) {
        if (this._booted_system != null) {
            throw new Error(`Crochet already booted.`);
        }
        const root = await this.crochet.register_package(entry);
        const booted = await this.crochet.boot(root.meta.name, target);
        await booted.initialise(root.meta.name);
        this._root = root;
        this._booted_system = booted;
        this._ffi = new crochet_1.ForeignInterface(this.system.universe, this.system.universe.world.packages.get(this.root.meta.name), this.root.filename);
    }
    async run(entry, args) {
        return await this.system.run(entry, args);
    }
    async run_tests(filter) {
        return await this.system.run_tests(filter);
    }
    package_url(name) {
        return `${this.library_base}/${name}/crochet.json`;
    }
}
exports.CrochetForBrowser = CrochetForBrowser;

}).call(this)}).call(this,require("buffer").Buffer)
},{"../../crochet":7,"../../pkg":19,"buffer":65}],24:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Package = void 0;
const Package = require("../../pkg");
exports.Package = Package;
__exportStar(require("./browser"), exports);

},{"../../pkg":19,"./browser":23}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.intersect = exports.union = exports.difference = exports.BagMap = void 0;
class Pair {
    constructor(key, value) {
        this.key = key;
        this.value = value;
    }
}
class BagMap {
    constructor() {
        this.pairs = [];
    }
    set(key, value) {
        for (const pair of this.pairs) {
            if (pair.key.equals(key)) {
                pair.value = value;
                return;
            }
        }
        this.pairs.push(new Pair(key, value));
    }
    has(key) {
        for (const pair of this.pairs) {
            if (pair.key.equals(key)) {
                return true;
            }
        }
        return false;
    }
    get(key) {
        for (const pair of this.pairs) {
            if (pair.key.equals(key)) {
                return pair.value;
            }
        }
    }
    *entries() {
        for (const pair of this.pairs) {
            yield [pair.key, pair.value];
        }
    }
}
exports.BagMap = BagMap;
// s1 - s2
function difference(s1, s2) {
    const result = new Set();
    for (const x of s1.values()) {
        if (!s2.has(x)) {
            result.add(x);
        }
    }
    return result;
}
exports.difference = difference;
function union(s1, s2) {
    const result = new Set();
    for (const x of s1.values())
        result.add(x);
    for (const x of s2.values())
        result.add(x);
    return result;
}
exports.union = union;
function intersect(s1, s2) {
    const result = new Set();
    for (const x of s1.values()) {
        if (s2.has(x)) {
            result.add(x);
        }
    }
    return result;
}
exports.intersect = intersect;

},{}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = void 0;
function force(x) {
    if (typeof x === "function") {
        return x();
    }
    else {
        return x;
    }
}
class Logger {
    constructor() {
        this.verbose = false;
    }
    meta(level) {
        return `[${level}]`;
    }
    info(...xs) {
        console.log(this.meta("info"), ...xs.map(force));
    }
    debug(...xs) {
        if (this.verbose) {
            console.debug(this.meta("debug"), ...xs.map(force));
        }
    }
    error(...xs) {
        console.error(this.meta("error"), ...xs.map(force));
    }
}
exports.Logger = Logger;
exports.logger = new Logger();

},{}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.try_parse = exports.parse = exports.map_spec = exports.optional = exports.spec = exports.anyOf = exports.equal = exports.array = exports.nothing = exports.boolean = exports.number = exports.bigint_string = exports.bigint = exports.string = exports.lazy = exports.LazySpec = exports.EPath = exports.EAnyOf = exports.ENotEqual = exports.ENoKey = exports.EType = exports.Err = exports.Ok = void 0;
const util_1 = require("util");
class Ok {
    constructor(value) {
        this.value = value;
    }
    chain(f) {
        return f(this.value);
    }
    recover(f) {
        return this;
    }
}
exports.Ok = Ok;
class Err {
    constructor(reason) {
        this.reason = reason;
    }
    chain(f) {
        return this;
    }
    recover(f) {
        return f(this.reason);
    }
}
exports.Err = Err;
function collect(xs) {
    return xs.reduce((rs, x) => {
        return rs.chain((rsV) => {
            return x.chain((xV) => {
                return new Ok([...rsV, xV]);
            });
        });
    }, new Ok([]));
}
class EType {
    constructor(expected) {
        this.expected = expected;
    }
    format() {
        return `a value of type ${this.expected}`;
    }
}
exports.EType = EType;
class ENoKey {
    constructor(key) {
        this.key = key;
    }
    format() {
        return `the key ${JSON.stringify(this.key)} to be present`;
    }
}
exports.ENoKey = ENoKey;
class ENotEqual {
    constructor(expected) {
        this.expected = expected;
    }
    format() {
        return `${util_1.inspect(this.expected)}`;
    }
}
exports.ENotEqual = ENotEqual;
class EAnyOf {
    constructor(errors) {
        this.errors = errors;
    }
    format() {
        return `any of: ${this.errors.map((x) => x.format()).join(", ")}`;
    }
}
exports.EAnyOf = EAnyOf;
class EPath {
    constructor(key, error) {
        this.key = key;
        this.error = error;
    }
    get_path_and_error() {
        const go = (path, err) => {
            if (err instanceof EPath) {
                return go([...path, err.key], err.error);
            }
            else {
                return [path, err];
            }
        };
        return go([], this);
    }
    format() {
        const [path, error] = this.get_path_and_error();
        return `${error.format()} at path ${path.join(".")}`;
    }
}
exports.EPath = EPath;
const failed = new (class Failed {
})();
class LazySpec {
    constructor(thunk) {
        this.thunk = thunk;
    }
}
exports.LazySpec = LazySpec;
function lazy(x) {
    return new LazySpec(x);
}
exports.lazy = lazy;
function toSpec(x) {
    if (x instanceof LazySpec) {
        return toSpec(x.thunk());
    }
    else if (typeof x.spec === "function") {
        return x.spec;
    }
    else {
        return x;
    }
}
function string(x) {
    if (typeof x === "string") {
        return new Ok(x);
    }
    else {
        return new Err(new EType("string"));
    }
}
exports.string = string;
function bigint(x) {
    if (typeof x === "bigint") {
        return new Ok(x);
    }
    else {
        return new Err(new EType("bigint"));
    }
}
exports.bigint = bigint;
function bigint_string(x) {
    return string(x).chain((s) => {
        try {
            return new Ok(BigInt(s));
        }
        catch {
            return new Err(new EType("bigint"));
        }
    });
}
exports.bigint_string = bigint_string;
function number(x) {
    if (typeof x === "number") {
        return new Ok(x);
    }
    else {
        return new Err(new EType("number"));
    }
}
exports.number = number;
function boolean(x) {
    if (typeof x === "boolean") {
        return new Ok(x);
    }
    else {
        return new Err(new EType("boolean"));
    }
}
exports.boolean = boolean;
function nothing(x) {
    if (x == null) {
        return new Ok(null);
    }
    else {
        return new Err(new EType("nothing"));
    }
}
exports.nothing = nothing;
function array(f0) {
    const f = toSpec(f0);
    return (xs) => {
        if (Array.isArray(xs)) {
            return collect(xs.map(f));
        }
        else {
            return new Err(new EType("array"));
        }
    };
}
exports.array = array;
function equal(x) {
    return (value) => {
        if (value === x) {
            return new Ok(value);
        }
        else {
            return new Err(new ENotEqual(x));
        }
    };
}
exports.equal = equal;
function anyOf(fs) {
    return (value) => {
        return fs.map(toSpec).reduce((r, f) => {
            return r.recover((rs) => {
                return f(value).recover((e) => {
                    return new Err(new EAnyOf([...rs.errors, e]));
                });
            });
        }, new Err(new EAnyOf([])));
    };
}
exports.anyOf = anyOf;
function spec(type, parser) {
    return (value) => {
        if (value !== null && typeof value === "object") {
            const entries = collect(Object.entries(type).map(([k, f]) => {
                return toSpec(f)(value[k] ?? failed)
                    .recover((e) => new Err(new EPath(k, e)))
                    .chain((v) => new Ok([k, v]));
            }));
            return entries.chain((xs) => {
                const result = Object.create(null);
                for (const [k, v] of xs) {
                    result[k] = v;
                }
                return new Ok(parser(result));
            });
        }
        else {
            return new Err(new EType("object"));
        }
    };
}
exports.spec = spec;
function optional(spec, default_value) {
    return (value) => {
        if (value === failed) {
            return new Ok(default_value);
        }
        else {
            return toSpec(spec)(value);
        }
    };
}
exports.optional = optional;
function map_spec(spec, f) {
    return (value) => {
        return toSpec(spec)(value).chain((v) => new Ok(f(v)));
    };
}
exports.map_spec = map_spec;
function parse(x, spec) {
    const result = toSpec(spec)(x);
    if (result instanceof Ok) {
        return result.value;
    }
    else {
        throw new Error(`Failed to parse: Expected ${result.reason.format()}`);
    }
}
exports.parse = parse;
function try_parse(x, spec) {
    return toSpec(spec)(x);
}
exports.try_parse = try_parse;

},{"util":85}],28:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.format_time_diff = exports.gen = exports.clone_map = exports.copy_map = exports.every = exports.zip3 = exports.zip = exports.defer = exports.maybe_cast = exports.cast = exports.delay = exports.show = exports.unreachable = exports.force_cast = void 0;
const Util = require("util");
function force_cast(x) { }
exports.force_cast = force_cast;
function unreachable(x, message) {
    console.error(message, x);
    throw new Error(message);
}
exports.unreachable = unreachable;
function show(x) {
    return Util.inspect(x, false, null, true);
}
exports.show = show;
function delay(ms) {
    return new Promise((resolve) => setTimeout(() => resolve(), ms));
}
exports.delay = delay;
function cast(x, type) {
    if (x instanceof type) {
        return x;
    }
    else {
        const get_type = (x) => {
            if (x === null) {
                return `native null`;
            }
            else if (Object(x) !== x) {
                return `native ${typeof x}`;
            }
            else if (x?.type?.type_name) {
                return x.type.type_name;
            }
            else if (x?.type_name) {
                return x.type_name;
            }
            else if (x.constructor) {
                return x.constructor.name;
            }
            else {
                `<host value ${x?.name ?? typeof x}>`;
            }
        };
        throw new TypeError(`internal: expected ${get_type(type)}, got ${get_type(x)}`);
    }
}
exports.cast = cast;
function maybe_cast(x, type) {
    if (x instanceof type) {
        return x;
    }
    else {
        return null;
    }
}
exports.maybe_cast = maybe_cast;
function defer() {
    const deferred = Object.create(null);
    deferred.promise = new Promise((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });
    return deferred;
}
exports.defer = defer;
function* zip(xs, ys) {
    if (xs.length !== ys.length) {
        throw new Error(`Can't zip lists of different lengths`);
    }
    for (let i = 0; i < xs.length; ++i) {
        yield [xs[i], ys[i]];
    }
}
exports.zip = zip;
function* zip3(xs, ys, zs) {
    if (xs.length !== ys.length || xs.length !== zs.length) {
        throw new Error(`Can't zip lists of different lengths`);
    }
    for (let i = 0; i < xs.length; ++i) {
        yield [xs[i], ys[i], zs[i]];
    }
}
exports.zip3 = zip3;
function every(xs, pred) {
    for (const x of xs) {
        if (!pred(x)) {
            return false;
        }
    }
    return true;
}
exports.every = every;
function copy_map(source, target) {
    for (const [k, v] of source.entries()) {
        target.set(k, v);
    }
    return target;
}
exports.copy_map = copy_map;
function clone_map(source) {
    const map = new Map();
    for (const [k, v] of source.entries()) {
        map.set(k, v);
    }
    return map;
}
exports.clone_map = clone_map;
function* gen(x) {
    yield* x;
}
exports.gen = gen;
// assumes nanoseconds
function format_time_diff(n) {
    const units = [
        [1000n, "μs"],
        [1000n, "ms"],
        [1000n, "s"],
    ];
    let value = n;
    let suffix = "ns";
    for (const [divisor, unit] of units) {
        if (value > divisor) {
            value = value / divisor;
            suffix = unit;
        }
        else {
            break;
        }
    }
    return `${value}${suffix}`;
}
exports.format_time_diff = format_time_diff;

},{"util":85}],29:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XorShift = void 0;
class XorShift {
    constructor(seed, inc) {
        this._seed = seed | 0;
        this._inc = inc | 0;
    }
    static new_random() {
        return XorShift.from_seed(random_int(2 ** 10, 2 ** 31));
    }
    static from_seed(seed) {
        return new XorShift(seed | 0, seed | 0);
    }
    get seed() {
        return this._seed;
    }
    get inc() {
        return this._inc;
    }
    reseed(seed) {
        this._seed = seed | 0;
        this._inc = seed;
    }
    clone() {
        return new XorShift(this._seed, this._inc);
    }
    next() {
        let t = this._seed;
        t ^= (t | 0) << 13;
        t ^= (t | 0) << 25;
        t ^= (t | 0) << 9;
        this._inc = (this._inc + 1368297235087925) | 0;
        t = Math.abs((t + this._inc) | 0);
        this._seed = t;
        return t;
    }
    random() {
        return 2 ** -31 * this.next();
    }
    random_integer(min, max) {
        return min + Math.floor(this.random() * (max - min));
    }
    random_choice(xs) {
        if (xs.length === 0) {
            return null;
        }
        else {
            const choice = this.random_integer(0, xs.length);
            return xs[choice];
        }
    }
    random_choice_mut(xs) {
        if (xs.length === 0) {
            return null;
        }
        else {
            const choice = this.random_integer(0, xs.length);
            const result = xs[choice];
            xs.splice(choice, 1);
            return result;
        }
    }
    random_choice_many(size, xs) {
        const result = [];
        const candidates = xs.slice();
        while (result.length < size) {
            const entry = this.random_choice_mut(candidates);
            if (entry == null) {
                return result;
            }
            else {
                result.push(entry);
            }
        }
        return result;
    }
    random_weighted_choice(xs) {
        if (xs.length === 0) {
            return null;
        }
        else {
            let total = 0;
            for (const [x, _] of xs) {
                total += x;
            }
            const sorted_xs = xs.sort(([x1, _1], [x2, _2]) => x2 - x1);
            let choice = this.random_integer(0, total);
            for (const [score, item] of sorted_xs) {
                if (choice <= score) {
                    return item;
                }
                else {
                    choice -= score;
                }
            }
        }
        throw new Error(`internal: weighted choice picked none`);
    }
}
exports.XorShift = XorShift;
XorShift.MIN_INTEGER = 0;
XorShift.MAX_INTEGER = (2 ** 32 - 1) | 0;
function random_int(min, max) {
    return min + Math.floor(Math.random() * (max - min));
}

},{}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.load_declaration = exports.load_module = exports.make_universe = void 0;
const IR = require("../ir");
const utils_1 = require("../utils/utils");
const xorshift_1 = require("../utils/xorshift");
const evaluation_1 = require("./evaluation");
const intrinsics_1 = require("./intrinsics");
const logic_1 = require("./logic");
const primitives_1 = require("./primitives");
const simulation_1 = require("./simulation");
function make_universe() {
    const world = new intrinsics_1.CrochetWorld();
    // Core types
    const Any = new intrinsics_1.CrochetType(null, "any", "", null, [], [], false, null);
    const Unknown = new intrinsics_1.CrochetType(null, "unknown", "", Any, [], [], false, null);
    const Nothing = new intrinsics_1.CrochetType(null, "nothing", "", Any, [], [], false, null);
    const Boolean = new intrinsics_1.CrochetType(null, "boolean", "", Any, [], [], false, null);
    const True = new intrinsics_1.CrochetType(null, "true", "", Boolean, [], [], false, null);
    const False = new intrinsics_1.CrochetType(null, "false", "", Boolean, [], [], false, null);
    const Numeric = new intrinsics_1.CrochetType(null, "numeric", "", Any, [], [], false, null);
    const Fractional = new intrinsics_1.CrochetType(null, "fractional", "", Numeric, [], [], false, null);
    const Integral = new intrinsics_1.CrochetType(null, "integral", "", Numeric, [], [], false, null);
    const Float = new intrinsics_1.CrochetType(null, "float", "", Fractional, [], [], false, null);
    const Integer = new intrinsics_1.CrochetType(null, "integer", "", Integral, [], [], false, null);
    const Text = new intrinsics_1.CrochetType(null, "text", "", Any, [], [], false, null);
    const StaticText = new intrinsics_1.CrochetType(null, "static-text", "", Text, [], [], false, null);
    const Interpolation = new intrinsics_1.CrochetType(null, "interpolation", "", Any, [], [], false, null);
    const Function = new intrinsics_1.CrochetType(null, "function", "", Any, [], [], false, null);
    const functions = [];
    for (let i = 0; i < 10; ++i) {
        functions.push(new intrinsics_1.CrochetType(null, `function-${i}`, "", Function, [], [], false, null));
    }
    const Thunk = new intrinsics_1.CrochetType(null, "thunk", "", Any, [], [], false, null);
    const Record = new intrinsics_1.CrochetType(null, "record", "", Any, [], [], false, null);
    const Tuple = new intrinsics_1.CrochetType(null, "tuple", "", Any, [], [], false, null);
    const Enum = new intrinsics_1.CrochetType(null, "enum", "", Any, [], [], false, null);
    const Cell = new intrinsics_1.CrochetType(null, "cell", "", Any, [], [], false, null);
    const Type = new intrinsics_1.CrochetType(null, "type", "", Any, [], [], false, null);
    const Effect = new intrinsics_1.CrochetType(null, "effect", "", null, [], [], false, null);
    // Simulations
    const Action = new intrinsics_1.CrochetType(null, "action", "", Any, [], [], false, null);
    const ActionChoice = new intrinsics_1.CrochetType(null, "action-choice", "", Any, ["score", "action", "environment"], [Integer, Action, Record], false, null);
    // Skeleton DSL
    const Skeleton = new intrinsics_1.CrochetType(null, "skeleton", "", Any, [], [], false, null);
    const SNode = new intrinsics_1.CrochetType(null, "skeleton-node", "", Skeleton, ["name", "children", "attributes"], [Text, Tuple, Record], false, null);
    const SLiteral = new intrinsics_1.CrochetType(null, "skeleton-literal", "", Skeleton, ["value"], [Any], false, null);
    const SName = new intrinsics_1.CrochetType(null, "skeleton-name", "", Skeleton, ["name"], [Text], false, null);
    const SDynamic = new intrinsics_1.CrochetType(null, "skeleton-dynamic", "", Skeleton, ["thunk"], [Thunk], false, null);
    const SList = new intrinsics_1.CrochetType(null, "skeleton-tuple", "", Skeleton, ["children"], [Tuple], false, null);
    const SInterpolation = new intrinsics_1.CrochetType(null, "skeleton-interpolation", "", Skeleton, ["parts"], [Tuple], false, null);
    world.native_types.define("crochet.core/core.any", Any);
    world.native_types.define("crochet.core/core.unknown", Unknown);
    world.native_types.define("crochet.core/core.nothing", Nothing);
    world.native_types.define("crochet.core/core.boolean", Boolean);
    world.native_types.define("crochet.core/core.true", True);
    world.native_types.define("crochet.core/core.false", False);
    world.native_types.define("crochet.core/core.numeric", Numeric);
    world.native_types.define("crochet.core/core.fractional", Fractional);
    world.native_types.define("crochet.core/core.integral", Integral);
    world.native_types.define("crochet.core/core.float", Float);
    world.native_types.define("crochet.core/core.integer", Integer);
    world.native_types.define("crochet.core/core.text", Text);
    world.native_types.define("crochet.core/core.static-text", StaticText);
    world.native_types.define("crochet.core/core.interpolation", Interpolation);
    world.native_types.define("crochet.core/core.function", Function);
    for (const f of functions) {
        world.native_types.define(`crochet.core/core.${f.name}`, f);
    }
    world.native_types.define("crochet.core/core.thunk", Thunk);
    world.native_types.define("crochet.core/core.record", Record);
    world.native_types.define("crochet.core/core.tuple", Tuple);
    world.native_types.define("crochet.core/core.enum", Enum);
    world.native_types.define("crochet.core/core.cell", Cell);
    world.native_types.define("crochet.core/core.action", Action);
    world.native_types.define("crochet.core/core.skeleton-ast", Skeleton);
    world.native_types.define("crochet.core/core.skeleton-node", SNode);
    world.native_types.define("crochet.core/core.skeleton-name", SName);
    world.native_types.define("crochet.core/core.skeleton-literal", SLiteral);
    world.native_types.define("crochet.core/core.skeleton-dynamic", SDynamic);
    world.native_types.define("crochet.core/core.skeleton-tuple", SList);
    world.native_types.define("crochet.core/core.skeleton-interpolation", SInterpolation);
    world.native_types.define("crochet.core/core.action", Action);
    world.native_types.define("crochet.core/core.action-choice", ActionChoice);
    return new intrinsics_1.Universe(world, xorshift_1.XorShift.new_random(), {
        Any,
        Unknown,
        Nothing,
        True,
        False,
        Integer,
        Float,
        Text,
        StaticText,
        Interpolation,
        Function: functions,
        Thunk,
        Record,
        Tuple,
        Enum,
        Type,
        Cell,
        Action,
        ActionChoice,
        Effect,
        Skeleton: {
            Node: SNode,
            Name: SName,
            Literal: SLiteral,
            Dynamic: SDynamic,
            Tuple: SList,
            Interpolation: SInterpolation,
        },
    });
}
exports.make_universe = make_universe;
function load_module(universe, pkg, program) {
    const module = new intrinsics_1.CrochetModule(pkg, program.filename, new intrinsics_1.Metadata(program.source, program.meta_table));
    for (const x of program.declarations) {
        load_declaration(universe, module, x);
    }
    return module;
}
exports.load_module = load_module;
function load_declaration(universe, module, declaration) {
    const t = IR.DeclarationTag;
    switch (declaration.tag) {
        case t.COMMAND: {
            const command = primitives_1.Commands.get_or_make_command(universe, declaration.name, declaration.parameters.length);
            const branch = new intrinsics_1.CrochetCommandBranch(module, new intrinsics_1.Environment(null, null, module, null), declaration.name, declaration.documentation, declaration.parameters, declaration.types.map((t) => primitives_1.Types.materialise_type(universe, module, t)), declaration.body, declaration.meta);
            primitives_1.Commands.add_branch(command, branch);
            break;
        }
        case t.TYPE: {
            const parent = primitives_1.Types.materialise_type(universe, module, declaration.parent);
            const type = new intrinsics_1.CrochetType(module, declaration.name, declaration.documentation, parent, declaration.fields, declaration.types.map((t) => primitives_1.Types.materialise_type(universe, module, t)), false, declaration.meta);
            parent.sub_types.push(type);
            primitives_1.Types.define_type(module, declaration.name, type, declaration.visibility);
            break;
        }
        case t.EFFECT: {
            const effect = universe.types.Effect;
            const parent = new intrinsics_1.CrochetType(module, primitives_1.Effects.effect_name(declaration.name), declaration.documentation, effect, [], [], false, declaration.meta);
            for (const c of declaration.cases) {
                const type = new intrinsics_1.CrochetType(module, primitives_1.Effects.variant_name(declaration.name, c.name), c.documentation, parent, c.parameters, c.types.map((t) => primitives_1.Types.materialise_type(universe, module, t)), false, c.meta);
                parent.sub_types.push(type);
                primitives_1.Types.define_type(module, type.name, type, IR.Visibility.GLOBAL);
            }
            primitives_1.Types.define_type(module, parent.name, parent, IR.Visibility.GLOBAL);
            primitives_1.Types.seal(parent);
            break;
        }
        case t.FOREIGN_TYPE: {
            const type = primitives_1.Types.get_foreign_type(universe, module, declaration.target);
            primitives_1.Types.define_type(module, declaration.name, type, IR.Visibility.GLOBAL);
            break;
        }
        case t.SEAL: {
            const type = primitives_1.Types.get_type(module, declaration.name);
            primitives_1.Types.seal(type);
            break;
        }
        case t.TEST: {
            const test = new intrinsics_1.CrochetTest(module, new intrinsics_1.Environment(null, null, module, null), declaration.name, declaration.body);
            primitives_1.Tests.add_test(universe, test);
            break;
        }
        case t.OPEN: {
            primitives_1.Modules.open(module, declaration.namespace);
            break;
        }
        case t.DEFINE: {
            const value = evaluation_1.Thread.run_sync(universe, module, declaration.body);
            primitives_1.Modules.define(module, declaration.visibility, declaration.name, value);
            break;
        }
        case t.PRELUDE: {
            const env = new intrinsics_1.Environment(null, null, module, null);
            const prelude = new intrinsics_1.CrochetPrelude(env, declaration.body);
            primitives_1.World.add_prelude(universe.world, prelude);
            break;
        }
        case t.RELATION: {
            const type = logic_1.Tree.materialise_type(declaration.type);
            const tree = logic_1.Tree.materialise(type);
            logic_1.Relation.define_concrete(module, declaration.meta, declaration.name, declaration.documentation, type, tree);
            break;
        }
        case t.CONTEXT: {
            const context = new intrinsics_1.CrochetContext(declaration.meta, module, declaration.name, declaration.documentation);
            simulation_1.Contexts.define_context(module, context);
            break;
        }
        case t.ACTION: {
            const actor = primitives_1.Types.materialise_type(universe, module, declaration.actor);
            const action_type = new intrinsics_1.CrochetType(module, `action ${declaration.name}`, "", universe.types.Action, [], [], false, null);
            primitives_1.Types.define_type(module, action_type.name, action_type, IR.Visibility.GLOBAL);
            const action = new intrinsics_1.Action(action_type, declaration.meta, module, declaration.name, declaration.documentation, actor, declaration.parameter, declaration.predicate, declaration.rank_function, declaration.body);
            const context = simulation_1.Contexts.lookup_context(module, declaration.context);
            simulation_1.Contexts.add_action(module, context, action);
            break;
        }
        case t.WHEN: {
            const event = new intrinsics_1.When(declaration.meta, module, declaration.documentation, declaration.predicate, declaration.body);
            const context = simulation_1.Contexts.lookup_context(module, declaration.context);
            simulation_1.Contexts.add_event(context, event);
            break;
        }
        default:
            throw utils_1.unreachable(declaration, `Declaration`);
    }
}
exports.load_declaration = load_declaration;

},{"../ir":11,"../utils/utils":28,"../utils/xorshift":29,"./evaluation":32,"./intrinsics":34,"./logic":35,"./primitives":45,"./simulation":60}],31:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrochetEvaluationError = exports.ErrNativePanic = exports.ErrArbitrary = exports.CrochetError = void 0;
class CrochetError extends Error {
}
exports.CrochetError = CrochetError;
class ErrArbitrary extends CrochetError {
    constructor(tag, message) {
        super(`${tag}: ${message}`);
        this.tag = tag;
        this.message = message;
    }
}
exports.ErrArbitrary = ErrArbitrary;
class ErrNativePanic extends CrochetError {
    constructor(tag, message) {
        super(`${tag}: ${message}`);
        this.tag = tag;
        this.message = message;
    }
}
exports.ErrNativePanic = ErrNativePanic;
class CrochetEvaluationError extends CrochetError {
    constructor(source, trace, formatted_trace) {
        let native_trace = source instanceof Error ? source.stack ?? "" : "";
        if (native_trace != "") {
            const trace = native_trace.replace(/^.*?\n\s*at /, "");
            native_trace = `\n\nArising from the native code:\n${trace}`;
        }
        super([source.message, "\n\n", "Arising from:\n", formatted_trace, "\n"].join(""));
        this.source = source;
        this.trace = trace;
    }
}
exports.CrochetEvaluationError = CrochetEvaluationError;

},{}],32:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Thread = exports.AwaitSignal = exports.SetStateSignal = exports.ContinueSignal = exports.JumpSignal = exports.ReturnSignal = exports.SignalTag = exports.RunResultAwait = exports.RunResultDone = exports.RunResultTag = void 0;
const IR = require("../ir");
const ir_1 = require("../ir");
const logger_1 = require("../utils/logger");
const utils_1 = require("../utils/utils");
const errors_1 = require("./errors");
const intrinsics_1 = require("./intrinsics");
const logic_1 = require("./logic");
const namespaces_1 = require("./namespaces");
const primitives_1 = require("./primitives");
const simulation_1 = require("./simulation");
const simulation_2 = require("./simulation/simulation");
var RunResultTag;
(function (RunResultTag) {
    RunResultTag[RunResultTag["DONE"] = 0] = "DONE";
    RunResultTag[RunResultTag["AWAIT"] = 1] = "AWAIT";
})(RunResultTag = exports.RunResultTag || (exports.RunResultTag = {}));
class RunResultDone {
    constructor(value) {
        this.value = value;
        this.tag = RunResultTag.DONE;
    }
}
exports.RunResultDone = RunResultDone;
class RunResultAwait {
    constructor(promise) {
        this.promise = promise;
        this.tag = RunResultTag.AWAIT;
    }
}
exports.RunResultAwait = RunResultAwait;
var SignalTag;
(function (SignalTag) {
    SignalTag[SignalTag["RETURN"] = 0] = "RETURN";
    SignalTag[SignalTag["JUMP"] = 1] = "JUMP";
    SignalTag[SignalTag["CONTINUE"] = 2] = "CONTINUE";
    SignalTag[SignalTag["SET_STATE"] = 3] = "SET_STATE";
    SignalTag[SignalTag["AWAIT"] = 4] = "AWAIT";
})(SignalTag = exports.SignalTag || (exports.SignalTag = {}));
class ReturnSignal {
    constructor(value) {
        this.value = value;
        this.tag = SignalTag.RETURN;
    }
}
exports.ReturnSignal = ReturnSignal;
class JumpSignal {
    constructor(activation) {
        this.activation = activation;
        this.tag = SignalTag.JUMP;
    }
}
exports.JumpSignal = JumpSignal;
class ContinueSignal {
    constructor() {
        this.tag = SignalTag.CONTINUE;
    }
}
exports.ContinueSignal = ContinueSignal;
class SetStateSignal {
    constructor(state) {
        this.state = state;
        this.tag = SignalTag.SET_STATE;
    }
}
exports.SetStateSignal = SetStateSignal;
class AwaitSignal {
    constructor(promise) {
        this.promise = promise;
        this.tag = SignalTag.AWAIT;
    }
}
exports.AwaitSignal = AwaitSignal;
const _continue = new ContinueSignal();
class Thread {
    constructor(state) {
        this.state = state;
    }
    static run_sync(universe, module, block) {
        const root = new intrinsics_1.State(universe, new intrinsics_1.CrochetActivation(null, null, new intrinsics_1.Environment(null, null, module, null), intrinsics_1._done, new intrinsics_1.HandlerStack(null, []), block), universe.random);
        const thread = new Thread(root);
        const value = thread.run_synchronous();
        return value;
    }
    async run_to_completion() {
        let result = this.run();
        while (true) {
            switch (result.tag) {
                case RunResultTag.DONE:
                    return result.value;
                case RunResultTag.AWAIT: {
                    const value = await result.promise;
                    result = this.run_with_input(value);
                    continue;
                }
                default:
                    throw utils_1.unreachable(result, "RunResult");
            }
        }
    }
    run_synchronous() {
        const result = this.run();
        switch (result.tag) {
            case RunResultTag.DONE:
                return result.value;
            case RunResultTag.AWAIT:
                throw new errors_1.ErrArbitrary("non-synchronous-completion", `Expected a synchronous completion, but got an asynchronous signal`);
            default:
                throw utils_1.unreachable(result, "RunResult");
        }
    }
    run_with_input(input) {
        const activation = this.state.activation;
        switch (activation.tag) {
            case intrinsics_1.ActivationTag.CROCHET_ACTIVATION: {
                this.push(activation, input);
                activation.next();
                return this.run();
            }
            case intrinsics_1.ActivationTag.NATIVE_ACTIVATION: {
                const signal = this.step_native(activation, input);
                return this.run(signal);
            }
            default:
                throw utils_1.unreachable(activation, "Activation");
        }
    }
    run(initial_signal) {
        logger_1.logger.debug(`Running`, () => primitives_1.Location.simple_activation(this.state.activation));
        try {
            let signal = initial_signal ?? this.step();
            while (true) {
                switch (signal.tag) {
                    case SignalTag.CONTINUE:
                        signal = this.step();
                        continue;
                    case SignalTag.RETURN: {
                        return new RunResultDone(signal.value);
                    }
                    case SignalTag.SET_STATE: {
                        this.state = signal.state;
                        signal = this.step();
                        continue;
                    }
                    case SignalTag.JUMP: {
                        this.state.activation = signal.activation;
                        logger_1.logger.debug("Jump to", () => primitives_1.Location.simple_activation(signal.activation));
                        signal = this.step();
                        continue;
                    }
                    case SignalTag.AWAIT: {
                        return new RunResultAwait(signal.promise);
                    }
                    default:
                        throw utils_1.unreachable(signal, `Signal`);
                }
            }
        }
        catch (error) {
            const trace = primitives_1.StackTrace.collect_trace(this.state.activation);
            const formatted_trace = primitives_1.StackTrace.format_entries(trace);
            throw new errors_1.CrochetEvaluationError(error, trace, formatted_trace);
        }
    }
    step() {
        const activation = this.state.activation;
        switch (activation.tag) {
            case intrinsics_1.ActivationTag.CROCHET_ACTIVATION: {
                return this.step_crochet(activation);
            }
            case intrinsics_1.ActivationTag.NATIVE_ACTIVATION: {
                return this.step_native(activation, this.universe.nothing);
            }
            default:
                throw utils_1.unreachable(activation, `Activation`);
        }
    }
    apply_continuation(value, k, activation) {
        switch (k.tag) {
            case intrinsics_1.ContinuationTag.DONE: {
                return new ReturnSignal(value);
            }
            case intrinsics_1.ContinuationTag.RETURN: {
                switch (activation.tag) {
                    case intrinsics_1.ActivationTag.CROCHET_ACTIVATION: {
                        this.push(activation, value);
                        activation.next();
                        return new JumpSignal(activation);
                    }
                    case intrinsics_1.ActivationTag.NATIVE_ACTIVATION: {
                        return this.step_native(activation, value);
                    }
                    default:
                        throw utils_1.unreachable(activation, `Activation`);
                }
            }
            case intrinsics_1.ContinuationTag.TAP: {
                logger_1.logger.debug("Applying continuation", () => k.continuation);
                const new_state = k.continuation(k.saved_state, this.state, value);
                return new SetStateSignal(new_state);
            }
            default:
                throw utils_1.unreachable(k, `Continuation`);
        }
    }
    do_return(value, activation) {
        if (activation == null) {
            return new ReturnSignal(value);
        }
        else {
            return this.apply_continuation(value, this.state.activation.continuation, activation);
        }
    }
    step_native(activation, input) {
        const { value, done } = activation.routine.next(input);
        if (done) {
            if (!(value instanceof intrinsics_1.CrochetValue)) {
                throw new errors_1.ErrArbitrary("invalid-native-return", `The native function did not return a valid Crochet value`);
            }
            return this.do_return(value, activation.parent);
        }
        else {
            if (!(value instanceof intrinsics_1.NSBase)) {
                throw new errors_1.ErrArbitrary("invalid-native-yield", "The native function did not yield a valid signal");
            }
            switch (value.tag) {
                case intrinsics_1.NativeSignalTag.INVOKE: {
                    const command = primitives_1.Commands.get_command(this.universe, value.name);
                    const branch = primitives_1.Commands.select_branch(command, value.args);
                    const new_activation = primitives_1.Commands.prepare_activation(activation, branch, value.args);
                    return new JumpSignal(new_activation);
                }
                case intrinsics_1.NativeSignalTag.APPLY: {
                    const new_activation = primitives_1.Lambdas.prepare_activation(this.universe, activation, this.env, value.fn, value.args);
                    return new JumpSignal(new_activation);
                }
                case intrinsics_1.NativeSignalTag.EVALUATE: {
                    const new_activation = new intrinsics_1.CrochetActivation(activation, null, value.env, intrinsics_1._return, activation.handlers, value.block);
                    return new JumpSignal(new_activation);
                }
                case intrinsics_1.NativeSignalTag.AWAIT: {
                    return new AwaitSignal(value.promise);
                }
                case intrinsics_1.NativeSignalTag.JUMP: {
                    return new JumpSignal(value.activation(activation));
                }
                default:
                    throw utils_1.unreachable(value, `Native Signal`);
            }
        }
    }
    step_crochet(activation) {
        const op = activation.current;
        if (op == null) {
            if (activation.block_stack.length > 0) {
                logger_1.logger.debug(`Finished with block, taking next block`);
                activation.pop_block();
                activation.next();
                return _continue;
            }
            else {
                const value = activation.return_value ?? this.universe.nothing;
                logger_1.logger.debug(`Finished with activation, return value:`, () => primitives_1.Location.simple_value(value));
                return this.do_return(value, activation.parent);
            }
        }
        logger_1.logger.debug(`Stack:`, () => activation.stack.map(primitives_1.Location.simple_value));
        logger_1.logger.debug(`Executing operation:`, () => primitives_1.Location.simple_op(op, activation.instruction));
        const t = IR.OpTag;
        switch (op.tag) {
            case t.DROP: {
                this.pop(activation);
                activation.next();
                return _continue;
            }
            case t.LET: {
                const value = this.pop(activation);
                this.define(op.name, value, op.meta);
                activation.next();
                return _continue;
            }
            case t.PUSH_VARIABLE: {
                const value = this.lookup(op.name, op.meta);
                this.push(activation, value);
                activation.next();
                return _continue;
            }
            case t.PUSH_SELF: {
                const value = this.get_self(op.meta);
                this.push(activation, value);
                activation.next();
                return _continue;
            }
            case t.PUSH_GLOBAL: {
                const value = this.lookup_global(op.name, op.meta);
                this.push(activation, value);
                activation.next();
                return _continue;
            }
            case t.PUSH_LITERAL: {
                const value = primitives_1.Literals.materialise_literal(this.state.universe, op.value);
                this.push(activation, value);
                activation.next();
                return _continue;
            }
            case t.PUSH_RETURN: {
                const value = activation.return_value;
                if (value == null) {
                    throw new errors_1.ErrArbitrary("no-return", `Trying to access the return value, but no return value was defined yet`);
                }
                else {
                    this.push(activation, value);
                }
                activation.next();
                return _continue;
            }
            case t.PUSH_TUPLE: {
                const values = this.pop_many(activation, op.arity);
                const tuple = primitives_1.Values.make_tuple(this.state.universe, values);
                this.push(activation, tuple);
                activation.next();
                return _continue;
            }
            case t.PUSH_NEW: {
                const values = this.pop_many(activation, op.arity);
                const type = primitives_1.Types.materialise_type(this.state.universe, this.module, op.type);
                const value = primitives_1.Values.instantiate(type, values);
                this.push(activation, value);
                activation.next();
                return _continue;
            }
            case t.PUSH_STATIC_TYPE: {
                const type = primitives_1.Types.materialise_type(this.universe, this.module, op.type);
                const static_type = primitives_1.Types.get_static_type(this.universe, type);
                const value = primitives_1.Values.make_static_type(static_type);
                this.push(activation, value);
                activation.next();
                return _continue;
            }
            case t.INTERPOLATE: {
                const result = [];
                for (const part of op.parts) {
                    if (part == null) {
                        result.push(this.pop(activation));
                    }
                    else {
                        result.push(part);
                    }
                }
                const value = primitives_1.Values.make_interpolation(this.universe, result);
                this.push(activation, value);
                activation.next();
                return _continue;
            }
            case t.PUSH_LAZY: {
                const env = primitives_1.Environments.clone(this.env);
                const thunk = primitives_1.Values.make_thunk(this.universe, env, op.body);
                this.push(activation, thunk);
                activation.next();
                return _continue;
            }
            case t.FORCE: {
                const value = this.pop(activation);
                const thunk = primitives_1.Values.get_thunk(value);
                if (thunk.value != null) {
                    this.push(activation, thunk.value);
                    activation.next();
                    return _continue;
                }
                else {
                    return new JumpSignal(new intrinsics_1.CrochetActivation(this.state.activation, thunk, thunk.env, new intrinsics_1.ContinuationTap(this.state, (_previous, _state, value) => {
                        primitives_1.Values.update_thunk(thunk, value);
                        this.push(activation, value);
                        activation.next();
                        return new intrinsics_1.State(this.universe, activation, this.universe.random);
                    }), activation.handlers, thunk.body));
                }
            }
            case t.PUSH_LAMBDA: {
                const value = primitives_1.Values.make_lambda(this.universe, this.env, op.parameters, op.body);
                this.push(activation, value);
                activation.next();
                return _continue;
            }
            case t.INVOKE_FOREIGN: {
                const fn = primitives_1.Native.get_native(this.module, op.name);
                const args = this.pop_many(activation, op.arity);
                switch (fn.tag) {
                    case intrinsics_1.NativeTag.NATIVE_SYNCHRONOUS: {
                        primitives_1.Native.assert_native_tag(intrinsics_1.NativeTag.NATIVE_SYNCHRONOUS, fn);
                        const value = fn.payload(...args);
                        if (!(value instanceof intrinsics_1.CrochetValue)) {
                            throw new errors_1.ErrArbitrary(`invalid-value`, `Native function ${fn.name} in ${fn.pkg.name} returned an invalid value ${value}`);
                        }
                        this.push(activation, value);
                        activation.next();
                        return _continue;
                    }
                    case intrinsics_1.NativeTag.NATIVE_MACHINE: {
                        primitives_1.Native.assert_native_tag(intrinsics_1.NativeTag.NATIVE_MACHINE, fn);
                        const machine = fn.payload(...args);
                        const new_activation = new intrinsics_1.NativeActivation(activation, fn, this.env, machine, activation.handlers, intrinsics_1._return);
                        return new JumpSignal(new_activation);
                    }
                    default:
                        throw utils_1.unreachable(fn.tag, `Native function`);
                }
            }
            case t.INVOKE: {
                const command = primitives_1.Commands.get_command(this.universe, op.name);
                const args = this.pop_many(activation, op.arity);
                const branch = primitives_1.Commands.select_branch(command, args);
                const new_activation = primitives_1.Commands.prepare_activation(activation, branch, args);
                return new JumpSignal(new_activation);
            }
            case t.APPLY: {
                const lambda = this.pop(activation);
                const args = this.pop_many(activation, op.arity);
                const new_activation = primitives_1.Lambdas.prepare_activation(this.universe, activation, this.env, lambda, args);
                return new JumpSignal(new_activation);
            }
            case t.RETURN: {
                // FIXME: we should generate RETURNs properly instead...
                let value;
                if (activation.stack.length > 0) {
                    value = this.pop(activation);
                }
                else {
                    value = this.universe.nothing;
                }
                activation.set_return_value(value);
                activation.next();
                return _continue;
            }
            case t.PUSH_PARTIAL: {
                const value = primitives_1.Values.make_partial(this.universe, this.module, op.name, op.arity);
                this.push(activation, value);
                activation.next();
                return _continue;
            }
            case t.ASSERT: {
                const value = this.pop(activation);
                let diagnostics = "";
                if (op.expression != null) {
                    const [name, params] = op.expression;
                    const args = params.map((x) => this.lookup(x, null));
                    let i = 1;
                    const name1 = name.replace(/_/g, () => `#${i++}`);
                    const args1 = args
                        .map((x, i) => `  #${i + 1}) ${primitives_1.Location.simple_value(x)}\n`)
                        .join("");
                    diagnostics = `\n\nIn the expression ${name1}:\n${args1}\n`;
                }
                if (!primitives_1.Values.get_boolean(value)) {
                    throw new errors_1.ErrArbitrary("assertion-violated", `${ir_1.AssertType[op.kind]}: ${op.assert_tag}: ${op.message}${diagnostics}`);
                }
                activation.next();
                return _continue;
            }
            case t.BRANCH: {
                const value = this.pop(activation);
                if (primitives_1.Values.get_boolean(value)) {
                    activation.push_block(op.consequent);
                    return _continue;
                }
                else {
                    activation.push_block(op.alternate);
                    return _continue;
                }
            }
            case t.TYPE_TEST: {
                const value = this.pop(activation);
                const type = primitives_1.Types.materialise_type(this.universe, this.module, op.type);
                this.push(activation, primitives_1.Values.make_boolean(this.universe, primitives_1.Values.has_type(type, value)));
                activation.next();
                return _continue;
            }
            case t.INTRINSIC_EQUAL: {
                const right = this.pop(activation);
                const left = this.pop(activation);
                const value = primitives_1.Values.make_boolean(this.universe, primitives_1.Values.equals(left, right));
                this.push(activation, value);
                activation.next();
                return _continue;
            }
            case t.REGISTER_INSTANCE: {
                const value = this.pop(activation);
                primitives_1.Values.register_instance(this.universe, value);
                activation.next();
                return _continue;
            }
            case t.PUSH_RECORD: {
                const values = this.pop_many(activation, op.keys.length);
                const record = primitives_1.Values.make_record(this.universe, op.keys, values);
                this.push(activation, record);
                activation.next();
                return _continue;
            }
            case t.RECORD_AT_PUT: {
                const [record0, key0, value] = this.pop_many(activation, 3);
                const key = primitives_1.Values.text_to_string(key0);
                const record = primitives_1.Values.record_at_put(this.universe, record0, key, value);
                this.push(activation, record);
                activation.next();
                return _continue;
            }
            case t.PROJECT: {
                const [key0, value0] = this.pop_many(activation, 2);
                const key = primitives_1.Values.text_to_string(key0);
                const result = primitives_1.Values.project(value0, key);
                this.push(activation, result);
                activation.next();
                return _continue;
            }
            case t.PROJECT_STATIC: {
                const value = this.pop(activation);
                const result = primitives_1.Values.project(value, op.key);
                this.push(activation, result);
                activation.next();
                return _continue;
            }
            case t.FACT: {
                const values = this.pop_many(activation, op.arity);
                const relation = logic_1.Relation.lookup(this.module, this.module.relations, op.relation);
                logic_1.Relation.insert(relation, values);
                activation.next();
                return _continue;
            }
            case t.FORGET: {
                const values = this.pop_many(activation, op.arity);
                const relation = logic_1.Relation.lookup(this.module, this.module.relations, op.relation);
                logic_1.Relation.remove(relation, values);
                activation.next();
                return _continue;
            }
            case t.SEARCH: {
                const machine = logic_1.search(this.state, this.env, this.module, this.state.random, this.module.relations, op.predicate);
                const new_activation = new intrinsics_1.NativeActivation(activation, null, this.env, logic_1.run_search(this.universe, this.env, machine), activation.handlers, intrinsics_1._return);
                return new JumpSignal(new_activation);
            }
            case t.MATCH_SEARCH: {
                const bindings0 = this.pop(activation);
                const bindings = primitives_1.Values.get_array(bindings0).map((x) => primitives_1.Values.get_map(x));
                if (bindings.length === 0) {
                    activation.push_block(op.alternate);
                    return _continue;
                }
                else {
                    const new_activation = new intrinsics_1.NativeActivation(activation, null, this.env, logic_1.run_match_case(this.universe, this.env, bindings, op.block), activation.handlers, intrinsics_1._return);
                    return new JumpSignal(new_activation);
                }
            }
            case t.SIMULATE: {
                const actors0 = this.pop(activation);
                const actors = primitives_1.Values.get_array(actors0);
                const context = simulation_1.Contexts.lookup_context(this.module, op.context);
                const signals = new namespaces_1.Namespace(null, null);
                for (const signal of op.signals) {
                    signals.define(signal.name, new intrinsics_1.SimulationSignal(signal.meta, signal.name, signal.parameters, signal.body, this.module));
                }
                const simulation_state = new intrinsics_1.SimulationState(this.state, this.module, this.env, this.state.random, actors, context, op.goal, signals);
                const new_activation = new intrinsics_1.NativeActivation(activation, null, this.env, simulation_2.run_simulation(simulation_state), activation.handlers, intrinsics_1._return);
                return new JumpSignal(new_activation);
            }
            case t.PERFORM: {
                const args = this.pop_many(activation, op.arity);
                const type = primitives_1.Effects.materialise_effect(this.module, op.effect, op.variant);
                primitives_1.Effects.assert_can_perform(this.module, type);
                const value = primitives_1.Values.instantiate(type, args);
                const { handler, stack } = primitives_1.Effects.find_handler(activation.handlers, value);
                const new_activation = primitives_1.Effects.prepare_handler_activation(activation, stack, handler, value);
                return new JumpSignal(new_activation);
            }
            case t.CONTINUE_WITH: {
                const k = this.env.raw_continuation;
                if (k == null) {
                    throw new errors_1.ErrArbitrary("no-continuation", `'continue with' can only be used from inside handlers.`);
                }
                const value = this.pop(activation);
                return new JumpSignal(primitives_1.Effects.apply_continuation(k, value));
            }
            case t.HANDLE: {
                return new JumpSignal(primitives_1.Effects.make_handle(activation, this.module, this.env, op.body, op.handlers));
            }
            case t.DSL: {
                const type = primitives_1.Types.materialise_type(this.universe, this.module, op.type);
                const stype = primitives_1.Types.get_static_type(this.universe, type);
                const type_arg = primitives_1.Values.make_static_type(stype);
                const nodes = op.ast.map((x) => primitives_1.DSL.reify_dsl_node(this.universe, this.module, this.env, x));
                const arg = primitives_1.Values.make_tuple(this.universe, nodes);
                const command = primitives_1.Commands.get_command(this.universe, "_ evaluate: _");
                const branch = primitives_1.Commands.select_branch(command, [type_arg, arg]);
                const new_activation = primitives_1.Commands.prepare_activation(activation, branch, [
                    type_arg,
                    arg,
                ]);
                return new JumpSignal(new_activation);
            }
            default:
                throw utils_1.unreachable(op, `Operation`);
        }
    }
    get universe() {
        return this.state.universe;
    }
    get module() {
        const result = this.env.raw_module;
        if (result == null) {
            throw new errors_1.ErrArbitrary("no-module", `The execution requires a module, but none was provided`);
        }
        return result;
    }
    get env() {
        return this.state.activation.env;
    }
    get_self(meta) {
        const value = this.env.raw_receiver;
        if (value == null) {
            throw new errors_1.ErrArbitrary("no-self", `The current block of code does not have a 'self' argument`);
        }
        return value;
    }
    lookup(name, meta) {
        const value = this.env.try_lookup(name);
        if (value == null) {
            throw new errors_1.ErrArbitrary("undefined-variable", `The variable ${name} is not defined`);
        }
        else {
            return value;
        }
    }
    lookup_global(name, meta) {
        const value = this.module.definitions.try_lookup(name);
        if (value == null) {
            throw new errors_1.ErrArbitrary("undefined", `The definition ${name} is not accessible from ${primitives_1.Location.module_location(this.module)}`);
        }
        else {
            return value;
        }
    }
    define(name, value, meta) {
        if (!this.env.define(name, value)) {
            throw new errors_1.ErrArbitrary("duplicated-variable", `The variable ${name} is already defined`);
        }
    }
    pop(activation) {
        if (activation.stack.length === 0) {
            throw new errors_1.ErrArbitrary("vm:empty-stack", `Trying to get a value from an empty stack`);
        }
        return activation.stack.pop();
    }
    pop_many(activation, size) {
        if (activation.stack.length < size) {
            throw new errors_1.ErrArbitrary("vm:stack-too-small", `Trying to get ${size} values from a stack with only ${activation.stack.length} items`);
        }
        const result = new Array(size);
        const len = activation.stack.length;
        for (let i = size; i > 0; --i) {
            result[size - i] = activation.stack[len - i];
        }
        activation.stack.length = len - size;
        return result;
    }
    push(activation, value) {
        activation.stack.push(value);
    }
}
exports.Thread = Thread;

},{"../ir":11,"../utils/logger":26,"../utils/utils":28,"./errors":31,"./intrinsics":34,"./logic":35,"./namespaces":40,"./primitives":45,"./simulation":60,"./simulation/simulation":61}],33:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./errors"), exports);
__exportStar(require("./intrinsics"), exports);
__exportStar(require("./primitives"), exports);
__exportStar(require("./boot"), exports);
__exportStar(require("./evaluation"), exports);
__exportStar(require("./run"), exports);

},{"./boot":30,"./errors":31,"./evaluation":32,"./intrinsics":34,"./primitives":45,"./run":58}],34:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivationTag = exports._return = exports._done = exports.ContinuationTap = exports.ContinuationDone = exports.ContinuationReturn = exports.ContinuationTag = exports.Handler = exports.HandlerStack = exports.State = exports.Environment = exports.SimulationState = exports.SimulationSignal = exports.CrochetContext = exports.GlobalContext = exports.ContextTag = exports.When = exports.Action = exports.tree_end = exports.TreeEnd = exports.TreeMany = exports.TreeOne = exports.TreeBase = exports.type_end = exports.TTEnd = exports.TTMany = exports.TTOne = exports.TreeTag = exports.Pair = exports.ProceduralRelation = exports.ConcreteRelation = exports.CrochetRelation = exports.RelationTag = exports.CrochetModule = exports.CrochetPackage = exports.CrochetWorld = exports.CrochetPrelude = exports.CrochetTest = exports.Metadata = exports.NativeFunction = exports.NativeTag = exports.CrochetCommandBranch = exports.CrochetCommand = exports.CrochetType = exports.CrochetThunk = exports.CrochetCell = exports.CrochetPartial = exports.CrochetLambda = exports.CrochetValue = exports.Tag = void 0;
exports.Universe = exports.NativeActivation = exports.NSJump = exports.NSEvaluate = exports.NSAwait = exports.NSApply = exports.NSInvoke = exports.NSBase = exports.NativeSignalTag = exports.CrochetActivation = void 0;
const namespaces_1 = require("./namespaces");
//#region Base values
var Tag;
(function (Tag) {
    Tag[Tag["NOTHING"] = 0] = "NOTHING";
    Tag[Tag["INTEGER"] = 1] = "INTEGER";
    Tag[Tag["FLOAT_64"] = 2] = "FLOAT_64";
    Tag[Tag["TEXT"] = 3] = "TEXT";
    Tag[Tag["TRUE"] = 4] = "TRUE";
    Tag[Tag["FALSE"] = 5] = "FALSE";
    Tag[Tag["INTERPOLATION"] = 6] = "INTERPOLATION";
    Tag[Tag["TUPLE"] = 7] = "TUPLE";
    Tag[Tag["RECORD"] = 8] = "RECORD";
    Tag[Tag["INSTANCE"] = 9] = "INSTANCE";
    Tag[Tag["LAMBDA"] = 10] = "LAMBDA";
    Tag[Tag["PARTIAL"] = 11] = "PARTIAL";
    Tag[Tag["THUNK"] = 12] = "THUNK";
    Tag[Tag["CELL"] = 13] = "CELL";
    Tag[Tag["TYPE"] = 14] = "TYPE";
    Tag[Tag["ACTION"] = 15] = "ACTION";
    Tag[Tag["ACTION_CHOICE"] = 16] = "ACTION_CHOICE";
    Tag[Tag["UNKNOWN"] = 17] = "UNKNOWN";
})(Tag = exports.Tag || (exports.Tag = {}));
class CrochetValue {
    constructor(tag, type, payload) {
        this.tag = tag;
        this.type = type;
        this.payload = payload;
    }
}
exports.CrochetValue = CrochetValue;
class CrochetLambda {
    constructor(env, parameters, body) {
        this.env = env;
        this.parameters = parameters;
        this.body = body;
    }
}
exports.CrochetLambda = CrochetLambda;
class CrochetPartial {
    constructor(module, name, arity) {
        this.module = module;
        this.name = name;
        this.arity = arity;
    }
}
exports.CrochetPartial = CrochetPartial;
class CrochetCell {
    constructor(value) {
        this.value = value;
    }
}
exports.CrochetCell = CrochetCell;
class CrochetThunk {
    constructor(env, body) {
        this.env = env;
        this.body = body;
        this.value = null;
    }
}
exports.CrochetThunk = CrochetThunk;
class CrochetType {
    constructor(module, name, documentation, parent, fields, types, is_static, meta) {
        this.module = module;
        this.name = name;
        this.documentation = documentation;
        this.parent = parent;
        this.fields = fields;
        this.types = types;
        this.is_static = is_static;
        this.meta = meta;
        this.sealed = false;
        this.sub_types = [];
        this.layout = new Map(this.fields.map((k, i) => [k, i]));
    }
}
exports.CrochetType = CrochetType;
//#endregion
//#region Commands
class CrochetCommand {
    constructor(name, arity) {
        this.name = name;
        this.arity = arity;
        this.branches = [];
        this.versions = [];
    }
}
exports.CrochetCommand = CrochetCommand;
class CrochetCommandBranch {
    constructor(module, env, name, documentation, parameters, types, body, meta) {
        this.module = module;
        this.env = env;
        this.name = name;
        this.documentation = documentation;
        this.parameters = parameters;
        this.types = types;
        this.body = body;
        this.meta = meta;
    }
    get arity() {
        return this.types.length;
    }
}
exports.CrochetCommandBranch = CrochetCommandBranch;
var NativeTag;
(function (NativeTag) {
    NativeTag[NativeTag["NATIVE_SYNCHRONOUS"] = 0] = "NATIVE_SYNCHRONOUS";
    NativeTag[NativeTag["NATIVE_MACHINE"] = 1] = "NATIVE_MACHINE";
})(NativeTag = exports.NativeTag || (exports.NativeTag = {}));
class NativeFunction {
    constructor(tag, name, pkg, payload) {
        this.tag = tag;
        this.name = name;
        this.pkg = pkg;
        this.payload = payload;
    }
}
exports.NativeFunction = NativeFunction;
//#endregion
//#region Metadata
class Metadata {
    constructor(source, table) {
        this.source = source;
        this.table = table;
    }
}
exports.Metadata = Metadata;
//#endregion
//#region World
class CrochetTest {
    constructor(module, env, title, body) {
        this.module = module;
        this.env = env;
        this.title = title;
        this.body = body;
    }
}
exports.CrochetTest = CrochetTest;
class CrochetPrelude {
    constructor(env, body) {
        this.env = env;
        this.body = body;
    }
}
exports.CrochetPrelude = CrochetPrelude;
class CrochetWorld {
    constructor() {
        this.commands = new namespaces_1.Namespace(null, null);
        this.types = new namespaces_1.Namespace(null, null);
        this.definitions = new namespaces_1.Namespace(null, null);
        this.relations = new namespaces_1.Namespace(null, null);
        this.native_types = new namespaces_1.Namespace(null, null);
        this.native_functions = new namespaces_1.Namespace(null, null);
        this.actions = new namespaces_1.Namespace(null, null);
        this.contexts = new namespaces_1.Namespace(null, null);
        this.global_context = new GlobalContext();
        this.prelude = [];
        this.tests = [];
        this.packages = new Map();
    }
}
exports.CrochetWorld = CrochetWorld;
class CrochetPackage {
    constructor(world, name, filename) {
        this.world = world;
        this.name = name;
        this.filename = filename;
        this.dependencies = new Set();
        this.types = new namespaces_1.PassthroughNamespace(world.types, name);
        this.definitions = new namespaces_1.PassthroughNamespace(world.definitions, name);
        this.native_functions = new namespaces_1.Namespace(world.native_functions, name);
        this.relations = new namespaces_1.PassthroughNamespace(world.relations, name);
        this.actions = new namespaces_1.PassthroughNamespace(world.actions, name);
        this.contexts = new namespaces_1.PassthroughNamespace(world.contexts, name);
    }
}
exports.CrochetPackage = CrochetPackage;
class CrochetModule {
    constructor(pkg, filename, metadata) {
        this.pkg = pkg;
        this.filename = filename;
        this.metadata = metadata;
        this.open_prefixes = new Set();
        this.open_prefixes.add("crochet.core");
        this.types = new namespaces_1.Namespace(pkg.types, pkg.name, this.open_prefixes);
        this.definitions = new namespaces_1.Namespace(pkg.definitions, pkg.name, this.open_prefixes);
        this.relations = new namespaces_1.Namespace(pkg.relations, pkg.name, this.open_prefixes);
        this.actions = new namespaces_1.Namespace(pkg.actions, pkg.name, this.open_prefixes);
        this.contexts = new namespaces_1.Namespace(pkg.contexts, pkg.name, this.open_prefixes);
    }
}
exports.CrochetModule = CrochetModule;
//#endregion
//#region Relations
var RelationTag;
(function (RelationTag) {
    RelationTag[RelationTag["CONCRETE"] = 0] = "CONCRETE";
    RelationTag[RelationTag["PROCEDURAL"] = 1] = "PROCEDURAL";
})(RelationTag = exports.RelationTag || (exports.RelationTag = {}));
class CrochetRelation {
    constructor(tag, name, documentation, payload) {
        this.tag = tag;
        this.name = name;
        this.documentation = documentation;
        this.payload = payload;
    }
}
exports.CrochetRelation = CrochetRelation;
class ConcreteRelation {
    constructor(module, meta, type, tree) {
        this.module = module;
        this.meta = meta;
        this.type = type;
        this.tree = tree;
    }
}
exports.ConcreteRelation = ConcreteRelation;
class ProceduralRelation {
    constructor(search, sample) {
        this.search = search;
        this.sample = sample;
    }
}
exports.ProceduralRelation = ProceduralRelation;
class Pair {
    constructor(value, tree) {
        this.value = value;
        this.tree = tree;
    }
}
exports.Pair = Pair;
var TreeTag;
(function (TreeTag) {
    TreeTag[TreeTag["ONE"] = 0] = "ONE";
    TreeTag[TreeTag["MANY"] = 1] = "MANY";
    TreeTag[TreeTag["END"] = 2] = "END";
})(TreeTag = exports.TreeTag || (exports.TreeTag = {}));
class TTOne {
    constructor(next) {
        this.next = next;
        this.tag = TreeTag.ONE;
    }
}
exports.TTOne = TTOne;
class TTMany {
    constructor(next) {
        this.next = next;
        this.tag = TreeTag.MANY;
    }
}
exports.TTMany = TTMany;
class TTEnd {
    constructor() {
        this.tag = TreeTag.END;
    }
}
exports.TTEnd = TTEnd;
exports.type_end = new TTEnd();
class TreeBase {
}
exports.TreeBase = TreeBase;
class TreeOne extends TreeBase {
    constructor(type) {
        super();
        this.type = type;
        this.tag = TreeTag.ONE;
        this.value = null;
    }
}
exports.TreeOne = TreeOne;
class TreeMany extends TreeBase {
    constructor(type) {
        super();
        this.type = type;
        this.tag = TreeTag.MANY;
        this.pairs = [];
    }
}
exports.TreeMany = TreeMany;
class TreeEnd extends TreeBase {
    constructor() {
        super();
        this.tag = TreeTag.END;
    }
}
exports.TreeEnd = TreeEnd;
exports.tree_end = new TreeEnd();
//#endregion
//#region Simulation
class Action {
    constructor(type, meta, module, name, documentation, actor_type, self_parameter, predicate, rank_function, body) {
        this.type = type;
        this.meta = meta;
        this.module = module;
        this.name = name;
        this.documentation = documentation;
        this.actor_type = actor_type;
        this.self_parameter = self_parameter;
        this.predicate = predicate;
        this.rank_function = rank_function;
        this.body = body;
        this.fired = new Set();
    }
}
exports.Action = Action;
class When {
    constructor(meta, module, documentation, predicate, body) {
        this.meta = meta;
        this.module = module;
        this.documentation = documentation;
        this.predicate = predicate;
        this.body = body;
    }
}
exports.When = When;
var ContextTag;
(function (ContextTag) {
    ContextTag[ContextTag["LOCAL"] = 0] = "LOCAL";
    ContextTag[ContextTag["GLOBAL"] = 1] = "GLOBAL";
})(ContextTag = exports.ContextTag || (exports.ContextTag = {}));
class GlobalContext {
    constructor() {
        this.tag = ContextTag.GLOBAL;
        this.actions = [];
        this.events = [];
    }
}
exports.GlobalContext = GlobalContext;
class CrochetContext {
    constructor(meta, module, name, documentation) {
        this.meta = meta;
        this.module = module;
        this.name = name;
        this.documentation = documentation;
        this.tag = ContextTag.LOCAL;
        this.actions = [];
        this.events = [];
    }
}
exports.CrochetContext = CrochetContext;
class SimulationSignal {
    constructor(meta, name, parameters, body, module) {
        this.meta = meta;
        this.name = name;
        this.parameters = parameters;
        this.body = body;
        this.module = module;
    }
}
exports.SimulationSignal = SimulationSignal;
class SimulationState {
    constructor(state, module, env, random, actors, context, goal, signals) {
        this.state = state;
        this.module = module;
        this.env = env;
        this.random = random;
        this.actors = actors;
        this.context = context;
        this.goal = goal;
        this.signals = signals;
        this.rounds = 0n;
        this.acted = new Set();
        this.turn = null;
    }
}
exports.SimulationState = SimulationState;
//#endregion
//#region Evaluation
class Environment {
    constructor(parent, raw_receiver, raw_module, raw_continuation) {
        this.parent = parent;
        this.raw_receiver = raw_receiver;
        this.raw_module = raw_module;
        this.raw_continuation = raw_continuation;
        this.bindings = new Map();
    }
    define(name, value) {
        if (this.bindings.has(name)) {
            return false;
        }
        this.bindings.set(name, value);
        return true;
    }
    has(name) {
        return this.bindings.has(name);
    }
    try_lookup(name) {
        const value = this.bindings.get(name);
        if (value != null) {
            return value;
        }
        else if (this.parent != null) {
            return this.parent.try_lookup(name);
        }
        else {
            return null;
        }
    }
}
exports.Environment = Environment;
class State {
    constructor(universe, activation, random) {
        this.universe = universe;
        this.activation = activation;
        this.random = random;
    }
}
exports.State = State;
class HandlerStack {
    constructor(parent, handlers) {
        this.parent = parent;
        this.handlers = handlers;
        this.activation = null;
    }
}
exports.HandlerStack = HandlerStack;
class Handler {
    constructor(guard, parameters, env, body) {
        this.guard = guard;
        this.parameters = parameters;
        this.env = env;
        this.body = body;
    }
}
exports.Handler = Handler;
var ContinuationTag;
(function (ContinuationTag) {
    ContinuationTag[ContinuationTag["RETURN"] = 0] = "RETURN";
    ContinuationTag[ContinuationTag["DONE"] = 1] = "DONE";
    ContinuationTag[ContinuationTag["TAP"] = 2] = "TAP";
})(ContinuationTag = exports.ContinuationTag || (exports.ContinuationTag = {}));
class ContinuationReturn {
    constructor() {
        this.tag = ContinuationTag.RETURN;
    }
}
exports.ContinuationReturn = ContinuationReturn;
class ContinuationDone {
    constructor() {
        this.tag = ContinuationTag.DONE;
    }
}
exports.ContinuationDone = ContinuationDone;
class ContinuationTap {
    constructor(saved_state, continuation) {
        this.saved_state = saved_state;
        this.continuation = continuation;
        this.tag = ContinuationTag.TAP;
    }
}
exports.ContinuationTap = ContinuationTap;
exports._done = new ContinuationDone();
exports._return = new ContinuationReturn();
var ActivationTag;
(function (ActivationTag) {
    ActivationTag[ActivationTag["CROCHET_ACTIVATION"] = 0] = "CROCHET_ACTIVATION";
    ActivationTag[ActivationTag["NATIVE_ACTIVATION"] = 1] = "NATIVE_ACTIVATION";
})(ActivationTag = exports.ActivationTag || (exports.ActivationTag = {}));
class CrochetActivation {
    constructor(parent, location, env, continuation, handlers, block) {
        this.parent = parent;
        this.location = location;
        this.env = env;
        this.continuation = continuation;
        this.handlers = handlers;
        this.block = block;
        this.tag = ActivationTag.CROCHET_ACTIVATION;
        this.stack = [];
        this.block_stack = [];
        this._return = null;
        this.instruction = 0;
    }
    get current() {
        if (this.instruction < 0 || this.instruction > this.block.ops.length) {
            return null;
        }
        return this.block.ops[this.instruction];
    }
    next() {
        this.instruction += 1;
    }
    get return_value() {
        return this._return;
    }
    set_return_value(value) {
        this._return = value;
    }
    push_block(b) {
        this.block_stack.push([this.instruction, this.block]);
        this.block = b;
        this.instruction = 0;
    }
    pop_block() {
        if (this.block_stack.length === 0) {
            throw new Error(`internal: pop_block() on empty stack`);
        }
        const [pc, block] = this.block_stack.pop();
        this.block = block;
        this.instruction = pc;
    }
}
exports.CrochetActivation = CrochetActivation;
var NativeSignalTag;
(function (NativeSignalTag) {
    NativeSignalTag[NativeSignalTag["INVOKE"] = 0] = "INVOKE";
    NativeSignalTag[NativeSignalTag["APPLY"] = 1] = "APPLY";
    NativeSignalTag[NativeSignalTag["AWAIT"] = 2] = "AWAIT";
    NativeSignalTag[NativeSignalTag["EVALUATE"] = 3] = "EVALUATE";
    NativeSignalTag[NativeSignalTag["JUMP"] = 4] = "JUMP";
})(NativeSignalTag = exports.NativeSignalTag || (exports.NativeSignalTag = {}));
class NSBase {
}
exports.NSBase = NSBase;
class NSInvoke extends NSBase {
    constructor(name, args) {
        super();
        this.name = name;
        this.args = args;
        this.tag = NativeSignalTag.INVOKE;
    }
}
exports.NSInvoke = NSInvoke;
class NSApply extends NSBase {
    constructor(fn, args) {
        super();
        this.fn = fn;
        this.args = args;
        this.tag = NativeSignalTag.APPLY;
    }
}
exports.NSApply = NSApply;
class NSAwait extends NSBase {
    constructor(promise) {
        super();
        this.promise = promise;
        this.tag = NativeSignalTag.AWAIT;
    }
}
exports.NSAwait = NSAwait;
class NSEvaluate extends NSBase {
    constructor(env, block) {
        super();
        this.env = env;
        this.block = block;
        this.tag = NativeSignalTag.EVALUATE;
    }
}
exports.NSEvaluate = NSEvaluate;
class NSJump extends NSBase {
    constructor(activation) {
        super();
        this.activation = activation;
        this.tag = NativeSignalTag.JUMP;
    }
}
exports.NSJump = NSJump;
class NativeActivation {
    constructor(parent, location, env, routine, handlers, continuation) {
        this.parent = parent;
        this.location = location;
        this.env = env;
        this.routine = routine;
        this.handlers = handlers;
        this.continuation = continuation;
        this.tag = ActivationTag.NATIVE_ACTIVATION;
    }
}
exports.NativeActivation = NativeActivation;
class Universe {
    constructor(world, random, types) {
        this.world = world;
        this.random = random;
        this.types = types;
        this.type_cache = new Map();
        this.registered_instances = new Map();
        this.nothing = new CrochetValue(Tag.NOTHING, types.Nothing, null);
        this.true = new CrochetValue(Tag.TRUE, types.True, null);
        this.false = new CrochetValue(Tag.FALSE, types.False, null);
        this.integer_cache = [];
        this.float_cache = [];
        for (let i = 0; i < 256; ++i) {
            this.integer_cache[i] = new CrochetValue(Tag.INTEGER, types.Integer, BigInt(i));
            this.float_cache[i] = new CrochetValue(Tag.FLOAT_64, types.Float, i);
        }
    }
    make_integer(x) {
        if (x >= 0 && x < this.integer_cache.length) {
            return this.integer_cache[Number(x)];
        }
        else {
            return new CrochetValue(Tag.INTEGER, this.types.Integer, x);
        }
    }
    make_float(x) {
        if (Number.isInteger(x) && x >= 0 && x < this.float_cache.length) {
            return this.float_cache[x];
        }
        else {
            return new CrochetValue(Tag.FLOAT_64, this.types.Float, x);
        }
    }
    make_text(x) {
        return new CrochetValue(Tag.TEXT, this.types.Text, x);
    }
}
exports.Universe = Universe;
//#endregion

},{"./namespaces":40}],35:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Relation = exports.Tree = void 0;
__exportStar(require("./unification"), exports);
__exportStar(require("./predicate"), exports);
const Tree = require("./tree");
exports.Tree = Tree;
const Relation = require("./relations");
exports.Relation = Relation;

},{"./predicate":36,"./relations":37,"./tree":38,"./unification":39}],36:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run_match_case = exports.run_search = exports.search = void 0;
const IR = require("../../ir");
const utils_1 = require("../../utils/utils");
const intrinsics_1 = require("../intrinsics");
const Relations = require("./relations");
const primitives_1 = require("../primitives");
function search(state, env, module, random, relations, predicate) {
    const t = IR.PredicateTag;
    function* go(predicate, env) {
        switch (predicate.tag) {
            case t.ALWAYS: {
                return [env];
            }
            case t.AND: {
                const result = [];
                const lenvs = yield* go(predicate.left, env);
                for (const lenv of lenvs) {
                    const renvs = yield* go(predicate.right, lenv);
                    for (const e of renvs) {
                        result.push(e);
                    }
                }
                return result;
            }
            case t.CONSTRAIN: {
                const result = [];
                const envs = yield* go(predicate.predicate, env);
                for (const e of envs) {
                    const value = yield new intrinsics_1.NSEvaluate(primitives_1.Environments.clone(e), predicate.constraint);
                    if (primitives_1.Values.get_boolean(value)) {
                        result.push(e);
                    }
                }
                return result;
            }
            case t.LET: {
                const env1 = primitives_1.Environments.clone(env);
                const value = yield new intrinsics_1.NSEvaluate(primitives_1.Environments.clone(env), predicate.value);
                env1.define(predicate.name, value);
                return [env1];
            }
            case t.NOT: {
                const envs = yield* go(predicate.pred, env);
                if (envs.length === 0) {
                    return [env];
                }
                else {
                    return [];
                }
            }
            case t.OR: {
                const lenvs = yield* go(predicate.left, env);
                if (lenvs.length !== 0) {
                    return lenvs;
                }
                else {
                    return yield* go(predicate.right, env);
                }
            }
            case t.RELATION: {
                const relation = Relations.lookup(module, relations, predicate.relation);
                const envs = Relations.search(state, module, env, relation, predicate.patterns);
                return envs;
            }
            case t.SAMPLE_RELATION: {
                const relation = Relations.lookup(module, relations, predicate.relation);
                const envs = Relations.sample(state, module, random, predicate.size, env, relation, predicate.patterns);
                return envs;
            }
            case t.TYPE: {
                const result = [];
                const type = primitives_1.Types.materialise_type(state.universe, module, predicate.type);
                const instances = primitives_1.Types.registered_instances(state.universe, type);
                for (const x of instances) {
                    const new_env = primitives_1.Environments.clone(env);
                    new_env.define(predicate.name, x);
                    result.push(new_env);
                }
                return result;
            }
            case t.SAMPLE_TYPE: {
                const result = [];
                const type = primitives_1.Types.materialise_type(state.universe, module, predicate.type);
                const instances = [...primitives_1.Types.registered_instances(state.universe, type)];
                const sampled = random.random_choice_many(predicate.size, instances);
                for (const x of sampled) {
                    const new_env = primitives_1.Environments.clone(env);
                    new_env.define(predicate.name, x);
                    result.push(new_env);
                }
                return result;
            }
            default:
                throw utils_1.unreachable(predicate, `Predicate`);
        }
    }
    return go(predicate, env);
}
exports.search = search;
function* run_search(universe, mark, machine) {
    const envs = yield* machine;
    const result = [];
    for (const e of envs) {
        const bound = primitives_1.Environments.bound_values_up_to(mark, e);
        result.push(primitives_1.Values.make_record_from_map(universe, bound));
    }
    return primitives_1.Values.make_tuple(universe, result);
}
exports.run_search = run_search;
function* run_match_case(universe, base_env, bindings, block) {
    const result = [];
    for (const binds of bindings) {
        const new_env = primitives_1.Environments.clone_with_bindings(base_env, binds);
        const value = yield new intrinsics_1.NSEvaluate(new_env, block);
        result.push(value);
    }
    return primitives_1.Values.make_tuple(universe, result);
}
exports.run_match_case = run_match_case;

},{"../../ir":11,"../../utils/utils":28,"../intrinsics":34,"../primitives":45,"./relations":37}],37:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.insert = exports.assert_tag = exports.sample = exports.search = exports.lookup = exports.make_functional_layer = exports.define_concrete = void 0;
const utils_1 = require("../../utils/utils");
const errors_1 = require("../errors");
const intrinsics_1 = require("../intrinsics");
const Tree = require("./tree");
const namespaces_1 = require("../namespaces");
const primitives_1 = require("../primitives");
function define_concrete(module, meta, name, documentation, type, tree) {
    const result = module.pkg.relations.define(name, new intrinsics_1.CrochetRelation(intrinsics_1.RelationTag.CONCRETE, name, documentation, new intrinsics_1.ConcreteRelation(module, meta, type, tree)));
    if (!result) {
        throw new errors_1.ErrArbitrary("duplicate-relation", `Could not define relation ${name} in module ${primitives_1.Location.module_location(module)}`);
    }
}
exports.define_concrete = define_concrete;
function make_functional_layer(module, funs) {
    // FIXME: this needs some more thinking
    const prefixes = new Set([...module.open_prefixes, module.pkg.name]);
    const layer = new namespaces_1.Namespace(module.relations, null, prefixes);
    for (const [name, fun] of funs) {
        layer.define(name, new intrinsics_1.CrochetRelation(intrinsics_1.RelationTag.PROCEDURAL, name, "", fun));
    }
    return layer;
}
exports.make_functional_layer = make_functional_layer;
function lookup(module, relations, name) {
    const relation = relations.try_lookup(name);
    if (relation == null) {
        throw new errors_1.ErrArbitrary(`no-relation`, `Relation ${name} is not accessible from ${primitives_1.Location.module_location(module)}`);
    }
    return relation;
}
exports.lookup = lookup;
function search(state, module, env, relation, patterns) {
    switch (relation.tag) {
        case intrinsics_1.RelationTag.CONCRETE: {
            assert_tag(intrinsics_1.RelationTag.CONCRETE, relation);
            return Tree.search(state, module, env, relation.payload.tree, patterns);
        }
        case intrinsics_1.RelationTag.PROCEDURAL: {
            assert_tag(intrinsics_1.RelationTag.PROCEDURAL, relation);
            return relation.payload.search(env, patterns);
        }
        default:
            throw utils_1.unreachable(relation.tag, `Relation`);
    }
}
exports.search = search;
function sample(state, module, random, size, env, relation, patterns) {
    switch (relation.tag) {
        case intrinsics_1.RelationTag.CONCRETE: {
            assert_tag(intrinsics_1.RelationTag.CONCRETE, relation);
            return Tree.sample(state, module, random, size, env, relation.payload.tree, patterns);
        }
        case intrinsics_1.RelationTag.PROCEDURAL: {
            assert_tag(intrinsics_1.RelationTag.PROCEDURAL, relation);
            if (relation.payload.sample == null) {
                const result = relation.payload.search(env, patterns);
                return random.random_choice_many(size, result);
            }
            else {
                return relation.payload.sample(env, patterns, size);
            }
        }
        default:
            throw utils_1.unreachable(relation.tag, `Relation`);
    }
}
exports.sample = sample;
function assert_tag(tag, relation) {
    if (relation.tag !== tag) {
        throw new errors_1.ErrArbitrary("invalid-relation", `Expected a ${intrinsics_1.RelationTag[tag]} relation`);
    }
}
exports.assert_tag = assert_tag;
function insert(relation, values) {
    assert_tag(intrinsics_1.RelationTag.CONCRETE, relation);
    Tree.insert(relation.payload.tree, values);
}
exports.insert = insert;
function remove(relation, values) {
    assert_tag(intrinsics_1.RelationTag.CONCRETE, relation);
    const result = Tree.remove(relation.payload.tree, values).tree;
    if (result == null) {
        relation.payload.tree = Tree.materialise(relation.payload.type);
    }
    else {
        relation.payload.tree = result;
    }
}
exports.remove = remove;

},{"../../utils/utils":28,"../errors":31,"../intrinsics":34,"../namespaces":40,"../primitives":45,"./tree":38}],38:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sample = exports.search = exports.remove = exports.insert = exports.materialise = exports.materialise_type = void 0;
const IR = require("../../ir");
const utils_1 = require("../../utils/utils");
const intrinsics_1 = require("../intrinsics");
const primitives_1 = require("../primitives");
const unification_1 = require("./unification");
function materialise_type(type) {
    return type.reduceRight((prev, type) => {
        switch (type.multiplicity) {
            case IR.RelationMultiplicity.ONE:
                return new intrinsics_1.TTOne(prev);
            case IR.RelationMultiplicity.MANY:
                return new intrinsics_1.TTMany(prev);
            default:
                throw utils_1.unreachable(type.multiplicity, `Tree Type`);
        }
    }, intrinsics_1.tree_end);
}
exports.materialise_type = materialise_type;
function materialise(type) {
    switch (type.tag) {
        case intrinsics_1.TreeTag.ONE: {
            return new intrinsics_1.TreeOne(type.next);
        }
        case intrinsics_1.TreeTag.MANY: {
            return new intrinsics_1.TreeMany(type.next);
        }
        case intrinsics_1.TreeTag.END: {
            return intrinsics_1.tree_end;
        }
        default:
            throw utils_1.unreachable(type, `Tree Type`);
    }
}
exports.materialise = materialise;
function insert(tree, values) {
    let changed = false;
    function go(tree, index) {
        switch (tree.tag) {
            case intrinsics_1.TreeTag.ONE: {
                const head = values[index];
                if (tree.value == null || !primitives_1.Values.equals(head, tree.value.value)) {
                    tree.value = new intrinsics_1.Pair(head, materialise(tree.type));
                    changed = true;
                    go(tree.value.tree, index + 1);
                }
                else {
                    go(tree.value.tree, index + 1);
                }
                return;
            }
            case intrinsics_1.TreeTag.MANY: {
                const head = values[index];
                for (const pair of tree.pairs) {
                    if (primitives_1.Values.equals(head, pair.value)) {
                        go(pair.tree, index + 1);
                        return;
                    }
                }
                const subtree = materialise(tree.type);
                tree.pairs.push(new intrinsics_1.Pair(head, subtree));
                changed = true;
                go(subtree, index + 1);
                return;
            }
            case intrinsics_1.TreeTag.END: {
                return;
            }
            default:
                throw utils_1.unreachable(tree, `Tree`);
        }
    }
    go(tree, 0);
    return changed;
}
exports.insert = insert;
function remove(tree, values) {
    let changed = false;
    function go(tree, index) {
        switch (tree.tag) {
            case intrinsics_1.TreeTag.ONE: {
                const head = values[index];
                if (tree.value == null) {
                    return null;
                }
                if (primitives_1.Values.equals(head, tree.value.value)) {
                    changed = true;
                    tree.value = null;
                    return null;
                }
                else {
                    const result = go(tree.value.tree, index + 1);
                    if (result == null) {
                        changed = true;
                        tree.value = null;
                        return null;
                    }
                    else {
                        tree.value.tree = result;
                        return tree;
                    }
                }
            }
            case intrinsics_1.TreeTag.MANY: {
                const head = values[index];
                const new_pairs = [];
                for (const pair of tree.pairs) {
                    if (primitives_1.Values.equals(head, pair.value)) {
                        const result = go(pair.tree, index + 1);
                        if (result == null) {
                            changed = true;
                        }
                        else {
                            new_pairs.push(new intrinsics_1.Pair(pair.value, result));
                        }
                    }
                    else {
                        new_pairs.push(pair);
                    }
                }
                if (new_pairs.length === 0) {
                    return null;
                }
                else {
                    tree.pairs = new_pairs;
                    return tree;
                }
            }
            case intrinsics_1.TreeTag.END: {
                changed = true;
                return null;
            }
            default:
                throw utils_1.unreachable(tree, `Tree`);
        }
    }
    return { changed, tree: go(tree, 0) };
}
exports.remove = remove;
function search(state, module, env, tree, patterns) {
    function* go(tree, env, index) {
        switch (tree.tag) {
            case intrinsics_1.TreeTag.ONE: {
                if (tree.value == null) {
                    break;
                }
                const head = patterns[index];
                const new_env = unification_1.unify(state, module, env, tree.value.value, head);
                if (new_env != null) {
                    yield* go(tree.value.tree, new_env, index + 1);
                }
                break;
            }
            case intrinsics_1.TreeTag.MANY: {
                const head = patterns[index];
                for (const pair of tree.pairs) {
                    const new_env = unification_1.unify(state, module, env, pair.value, head);
                    if (new_env != null) {
                        yield* go(pair.tree, new_env, index + 1);
                    }
                }
                break;
            }
            case intrinsics_1.TreeTag.END: {
                yield env;
                break;
            }
            default:
                throw utils_1.unreachable(tree, `Tree`);
        }
    }
    return [...go(tree, env, 0)];
}
exports.search = search;
function sample(state, module, random, size, env, tree, patterns) {
    function* go(tree, env, index) {
        switch (tree.tag) {
            case intrinsics_1.TreeTag.ONE: {
                if (tree.value == null) {
                    break;
                }
                const head = patterns[index];
                const new_env = unification_1.unify(state, module, env, tree.value.value, head);
                if (new_env != null) {
                    yield* go(tree.value.tree, new_env, index + 1);
                }
                break;
            }
            case intrinsics_1.TreeTag.MANY: {
                const head = patterns[index];
                const pairs = [];
                for (const pair of tree.pairs) {
                    const new_env = unification_1.unify(state, module, env, pair.value, head);
                    if (new_env != null) {
                        pairs.push({ env: new_env, tree: pair.tree });
                    }
                }
                while (pairs.length > 0) {
                    const choice = random.random_choice_mut(pairs);
                    if (choice == null) {
                        break;
                    }
                    else {
                        yield* go(choice.tree, choice.env, index + 1);
                    }
                }
                break;
            }
            case intrinsics_1.TreeTag.END: {
                yield env;
                break;
            }
            default:
                throw utils_1.unreachable(tree, `Tree`);
        }
    }
    const results = [];
    for (const x of go(tree, env, 0)) {
        if (results.length > size) {
            break;
        }
        results.push(x);
    }
    return results;
}
exports.sample = sample;

},{"../../ir":11,"../../utils/utils":28,"../intrinsics":34,"../primitives":45,"./unification":39}],39:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unify_all = exports.unify = void 0;
const IR = require("../../ir");
const primitives_1 = require("../primitives");
const errors_1 = require("../errors");
const utils_1 = require("../../utils/utils");
function unify(state, module, env, value, pattern) {
    const t = IR.PatternTag;
    switch (pattern.tag) {
        case t.GLOBAL: {
            const global = module.definitions.try_lookup(pattern.name);
            if (global == null) {
                throw new errors_1.ErrArbitrary("no-definition", `${pattern.name} is not defined`);
            }
            if (primitives_1.Values.equals(global, value)) {
                return env;
            }
            else {
                return null;
            }
        }
        case t.HAS_TYPE: {
            const type = primitives_1.Types.materialise_type(state.universe, module, pattern.type);
            if (primitives_1.Values.has_type(type, value)) {
                return unify(state, module, env, value, pattern.pattern);
            }
            else {
                return null;
            }
        }
        case t.LITERAL: {
            const lit = primitives_1.Literals.materialise_literal(state.universe, pattern.literal);
            if (primitives_1.Values.equals(value, lit)) {
                return env;
            }
            else {
                return null;
            }
        }
        case t.SELF: {
            if (env.raw_receiver == null) {
                throw new errors_1.ErrArbitrary("no-receiver", `self with no receiver`);
            }
            if (primitives_1.Values.equals(value, env.raw_receiver)) {
                return env;
            }
            else {
                return null;
            }
        }
        case t.VARIABLE: {
            const local = env.try_lookup(pattern.name);
            if (local == null) {
                const new_env = primitives_1.Environments.clone(env);
                new_env.define(pattern.name, value);
                return new_env;
            }
            else if (primitives_1.Values.equals(local, value)) {
                return env;
            }
            else {
                return null;
            }
        }
        case t.WILDCARD: {
            return env;
        }
        default:
            throw utils_1.unreachable(pattern, `Pattern`);
    }
}
exports.unify = unify;
function unify_all(state, module, env, value, pattern) {
    const result = [];
    for (const x of value) {
        const new_env = unify(state, module, env, x, pattern);
        if (new_env != null) {
            result.push(new_env);
        }
    }
    return result;
}
exports.unify_all = unify_all;

},{"../../ir":11,"../../utils/utils":28,"../errors":31,"../primitives":45}],40:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PassthroughNamespace = exports.Namespace = void 0;
class Namespace {
    constructor(parent, prefix, allowed_prefixes) {
        this.parent = parent;
        this.prefix = prefix;
        this.bindings = new Map();
        this.allowed_prefixes = allowed_prefixes || new Set();
    }
    prefixed(name) {
        return this.make_namespace(this.prefix, name);
    }
    make_namespace(namespace, name) {
        if (namespace == null) {
            return name;
        }
        else {
            return `${namespace}/${name}`;
        }
    }
    define(name, value) {
        if (this.has_own(name)) {
            return false;
        }
        this.bindings.set(this.prefixed(name), value);
        return true;
    }
    has_own(name) {
        return this.bindings.has(this.prefixed(name));
    }
    has(name) {
        return this.try_lookup(name) != null;
    }
    try_lookup(name) {
        const value = this.try_lookup_namespaced(this.prefix, name);
        if (value != null) {
            return value;
        }
        else {
            for (const prefix of this.allowed_prefixes) {
                const value = this.try_lookup_namespaced(prefix, name);
                if (value != null) {
                    return value;
                }
            }
            return null;
        }
    }
    try_lookup_namespaced(namespace, name) {
        const value = this.bindings.get(this.make_namespace(namespace, name));
        if (value != null) {
            return value;
        }
        else if (this.parent != null) {
            return this.parent.try_lookup_namespaced(namespace, name);
        }
        else {
            return null;
        }
    }
}
exports.Namespace = Namespace;
class PassthroughNamespace extends Namespace {
    constructor(parent, prefix) {
        super(parent, prefix);
        this.parent = parent;
        this.prefix = prefix;
    }
    define(name, value) {
        return this.parent?.define(this.prefixed(name), value) ?? false;
    }
}
exports.PassthroughNamespace = PassthroughNamespace;

},{}],41:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_command = exports.get_or_make_command = exports.branch_accepts = exports.compare_branches = exports.select_exact = exports.assert_no_ambiguity = exports.prepare_activation = exports.select_branch = exports.add_branch = void 0;
const utils_1 = require("../../utils/utils");
const Types = require("./types");
const Location = require("./location");
const Environments = require("./environments");
const intrinsics_1 = require("../intrinsics");
const errors_1 = require("../errors");
function add_branch(command, branch) {
    assert_no_ambiguity([branch, ...command.branches], branch.types);
    command.versions.push(command.branches);
    command.branches.push(branch);
    command.branches.sort((b1, b2) => compare_branches(b1, b2));
}
exports.add_branch = add_branch;
// == Invocation
function select_branch(command, values) {
    const types = values.map((x) => x.type);
    for (const branch of command.branches) {
        if (branch_accepts(branch, types)) {
            return branch;
        }
    }
    throw new errors_1.ErrArbitrary("no-branch-matched", [
        "No definitions of command ",
        command.name,
        " matched the signature ",
        Location.command_signature(command.name, types),
        "\n",
        "The following arguments were provided:\n",
        values.map((x) => `  - ${Location.simple_value(x)}`).join("\n"),
        "\n\n",
        "The following branches are defined for the command:\n",
        command.branches
            .map((x) => `  - ${Location.branch_name_location(x)}`)
            .join("\n"),
    ].join(""));
}
exports.select_branch = select_branch;
function prepare_activation(parent_activation, branch, values) {
    const env = Environments.extend(branch.env, values.length === 0 ? null : values[0]);
    for (const [k, v] of utils_1.zip(branch.parameters, values)) {
        env.define(k, v);
    }
    const activation = new intrinsics_1.CrochetActivation(parent_activation, branch, env, intrinsics_1._return, parent_activation.handlers, branch.body);
    return activation;
}
exports.prepare_activation = prepare_activation;
// == Assertions
function assert_no_ambiguity(branches, types) {
    const selected = [...select_exact(branches, types)];
    if (selected.length > 1) {
        const dups = selected.map((x) => `  - ${Location.branch_name_location(x)}`);
        throw new errors_1.ErrArbitrary("ambiguous-dispatch", `Multiple ${selected[0].name} commands are activated by the same types, making them ambiguous:\n${dups.join("\n")}`);
    }
}
exports.assert_no_ambiguity = assert_no_ambiguity;
// == Selection
function* select_exact(branches, types) {
    outer: for (const branch of branches) {
        for (const [bt, t] of utils_1.zip(branch.types, types)) {
            if (bt !== t)
                continue outer;
        }
        yield branch;
    }
}
exports.select_exact = select_exact;
// == Testing
function compare_branches(b1, b2) {
    for (const [t1, t2] of utils_1.zip(b1.types, b2.types)) {
        const r = Types.compare(t1, t2);
        if (r !== 0) {
            return r;
        }
    }
    return 0;
}
exports.compare_branches = compare_branches;
function branch_accepts(branch, types) {
    if (branch.types.length !== types.length) {
        return false;
    }
    for (const [bt, t] of utils_1.zip(branch.types, types)) {
        if (!Types.is_subtype(t, bt)) {
            return false;
        }
    }
    return true;
}
exports.branch_accepts = branch_accepts;
// == Lookup
function get_or_make_command(universe, name, arity) {
    const command = universe.world.commands.try_lookup(name);
    if (command == null) {
        const command = new intrinsics_1.CrochetCommand(name, arity);
        universe.world.commands.define(name, command);
        return command;
    }
    else {
        return command;
    }
}
exports.get_or_make_command = get_or_make_command;
function get_command(universe, name) {
    const command = universe.world.commands.try_lookup(name);
    if (command == null) {
        throw new errors_1.ErrArbitrary("undefined-command", `The command ${name} is not defined`);
    }
    return command;
}
exports.get_command = get_command;

},{"../../utils/utils":28,"../errors":31,"../intrinsics":34,"./environments":44,"./location":48,"./types":55}],42:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reify_dsl_node = void 0;
const IR = require("../../ir");
const utils_1 = require("../../utils/utils");
const literals_1 = require("./literals");
const values_1 = require("./values");
function reify_dsl_node(universe, module, env, node) {
    switch (node.tag) {
        case IR.DslNodeTag.NODE: {
            const children = node.children.map((x) => reify_dsl_node(universe, module, env, x));
            const attrs = new Map();
            for (const [k, v] of node.attributes) {
                attrs.set(k, reify_dsl_node(universe, module, env, v));
            }
            return values_1.instantiate(universe.types.Skeleton.Node, [
                values_1.make_static_text(universe, node.name),
                values_1.make_tuple(universe, children),
                values_1.make_record_from_map(universe, attrs),
            ]);
        }
        case IR.DslNodeTag.LITERAL: {
            return values_1.instantiate(universe.types.Skeleton.Literal, [
                literals_1.materialise_literal(universe, node.value),
            ]);
        }
        case IR.DslNodeTag.VARIABLE: {
            return values_1.instantiate(universe.types.Skeleton.Name, [
                values_1.make_static_text(universe, node.name),
            ]);
        }
        case IR.DslNodeTag.EXPRESSION: {
            return values_1.instantiate(universe.types.Skeleton.Dynamic, [
                values_1.make_thunk(universe, env, node.value),
            ]);
        }
        case IR.DslNodeTag.LIST: {
            const children = node.children.map((x) => reify_dsl_node(universe, module, env, x));
            return values_1.instantiate(universe.types.Skeleton.Tuple, [
                values_1.make_tuple(universe, children),
            ]);
        }
        case IR.DslNodeTag.INTERPOLATION: {
            const parts = node.parts.map((x) => {
                switch (x.tag) {
                    case IR.DslInterpolationTag.STATIC: {
                        return values_1.make_static_text(universe, x.text);
                    }
                    case IR.DslInterpolationTag.DYNAMIC: {
                        return reify_dsl_node(universe, module, env, x.node);
                    }
                    default:
                        throw utils_1.unreachable(x, "DSL Interpolation part");
                }
            });
            return values_1.instantiate(universe.types.Skeleton.Interpolation, [
                values_1.make_tuple(universe, parts),
            ]);
        }
        default:
            throw utils_1.unreachable(node, "DSL Node");
    }
}
exports.reify_dsl_node = reify_dsl_node;

},{"../../ir":11,"../../utils/utils":28,"./literals":47,"./values":56}],43:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.make_handle = exports.apply_continuation = exports.prepare_handler_activation = exports.find_handler = exports.try_find_handler = exports.assert_can_perform = exports.materialise_effect = exports.variant_name = exports.effect_name = void 0;
const errors_1 = require("../errors");
const intrinsics_1 = require("../intrinsics");
const location_1 = require("./location");
const values_1 = require("./values");
const Environments = require("./environments");
function effect_name(x) {
    return `effect ${x}`;
}
exports.effect_name = effect_name;
function variant_name(x, variant) {
    return `effect ${x}.${variant}`;
}
exports.variant_name = variant_name;
function materialise_effect(module, name, variant) {
    const type = module.types.try_lookup(variant_name(name, variant));
    if (type == null) {
        throw new errors_1.ErrArbitrary(`undefined-effect`, `The effect ${name}.${variant} is not accessible from ${location_1.module_location(module)}`);
    }
    return type;
}
exports.materialise_effect = materialise_effect;
function assert_can_perform(module, type) {
    if (type.module?.pkg !== module.pkg) {
        throw new errors_1.ErrArbitrary(`no-perform-capability`, `Not allowing ${location_1.module_location(module)} to perform ${type.name}. The effect ${type.name} can only be performed from its defining package, ${type.module?.pkg.name ?? ""}.`);
    }
}
exports.assert_can_perform = assert_can_perform;
function try_find_handler(stack, value) {
    let current = stack;
    while (current != null) {
        for (const handler of current.handlers) {
            if (values_1.has_type(handler.guard, value)) {
                return { handler, stack: current };
            }
        }
        current = current.parent;
    }
    return null;
}
exports.try_find_handler = try_find_handler;
function find_handler(stack, value) {
    const result = try_find_handler(stack, value);
    if (result == null) {
        throw new errors_1.ErrArbitrary(`no-handler`, `No handler for ${location_1.simple_value(value)} was found in this context.`);
    }
    return result;
}
exports.find_handler = find_handler;
function prepare_handler_activation(activation, stack, handler, value) {
    values_1.assert_tag(intrinsics_1.Tag.INSTANCE, value);
    if (handler.parameters.length !== value.payload.length) {
        throw new errors_1.ErrArbitrary(`internal:invalid-layout`, `Corrupted layout for ${location_1.simple_value(value)}---does not match the expected layout.`);
    }
    const env = Environments.clone_with_continuation(handler.env, activation);
    for (let i = 0; i < handler.parameters.length; ++i) {
        env.define(handler.parameters[i], value.payload[i]);
    }
    return new intrinsics_1.CrochetActivation(stack.activation, null, env, intrinsics_1._return, stack, handler.body);
}
exports.prepare_handler_activation = prepare_handler_activation;
// TODO: Clone continuation in tracing mode
function apply_continuation(k, value) {
    k.stack.push(value);
    k.next();
    return k;
}
exports.apply_continuation = apply_continuation;
function make_handle(activation, module, env0, body, cases) {
    const env = Environments.clone(env0);
    const handlers = [];
    for (const h of cases) {
        const type = materialise_effect(module, h.effect, h.variant);
        handlers.push(new intrinsics_1.Handler(type, h.parameters, env, h.block));
    }
    const stack = new intrinsics_1.HandlerStack(activation.handlers, handlers);
    const new_activation = new intrinsics_1.CrochetActivation(activation, null, env, intrinsics_1._return, stack, body);
    stack.activation = activation;
    return new_activation;
}
exports.make_handle = make_handle;

},{"../errors":31,"../intrinsics":34,"./environments":44,"./location":48,"./values":56}],44:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bound_values_up_to = exports.extend_with_parameters_and_receiver = exports.extend_with_parameters = exports.extend = exports.clone_with_bindings = exports.clone_with_continuation = exports.clone = void 0;
const utils_1 = require("../../utils/utils");
const intrinsics_1 = require("../intrinsics");
function clone(env) {
    return new intrinsics_1.Environment(env, env.raw_receiver, env.raw_module, env.raw_continuation);
}
exports.clone = clone;
function clone_with_continuation(env, k) {
    return new intrinsics_1.Environment(env, env.raw_receiver, env.raw_module, k);
}
exports.clone_with_continuation = clone_with_continuation;
function clone_with_bindings(env, bindings) {
    const result = clone(env);
    for (const [k, v] of bindings) {
        result.define(k, v);
    }
    return result;
}
exports.clone_with_bindings = clone_with_bindings;
function extend(env, receiver) {
    return new intrinsics_1.Environment(env, receiver, env.raw_module, env.raw_continuation);
}
exports.extend = extend;
function extend_with_parameters(parent_env, parameters, values) {
    const receiver = values.length > 0 ? values[0] : null;
    const env = extend(parent_env, receiver);
    for (const [k, v] of utils_1.zip(parameters, values)) {
        env.define(k, v);
    }
    return env;
}
exports.extend_with_parameters = extend_with_parameters;
function extend_with_parameters_and_receiver(parent_env, parameters, values, receiver) {
    const env = extend(parent_env, receiver);
    for (const [k, v] of utils_1.zip(parameters, values)) {
        env.define(k, v);
    }
    return env;
}
exports.extend_with_parameters_and_receiver = extend_with_parameters_and_receiver;
function bound_values_up_to(mark_env, env) {
    let current = env;
    let result = new Map();
    while (current != null && current !== mark_env) {
        for (const [k, v] of current.bindings) {
            if (!result.has(k)) {
                result.set(k, v);
            }
        }
        current = current.parent;
    }
    return result;
}
exports.bound_values_up_to = bound_values_up_to;

},{"../../utils/utils":28,"../intrinsics":34}],45:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DSL = exports.Effects = exports.World = exports.Values = exports.Types = exports.Tests = exports.StackTrace = exports.Packages = exports.Native = exports.Modules = exports.Location = exports.Literals = exports.Lambdas = exports.Environments = exports.Commands = void 0;
const Location = require("./location");
exports.Location = Location;
const Commands = require("./commands");
exports.Commands = Commands;
const Types = require("./types");
exports.Types = Types;
const Values = require("./values");
exports.Values = Values;
const Literals = require("./literals");
exports.Literals = Literals;
const Environments = require("./environments");
exports.Environments = Environments;
const Native = require("./native");
exports.Native = Native;
const Lambdas = require("./lambdas");
exports.Lambdas = Lambdas;
const Tests = require("./tests");
exports.Tests = Tests;
const Modules = require("./modules");
exports.Modules = Modules;
const Packages = require("./packages");
exports.Packages = Packages;
const World = require("./world");
exports.World = World;
const StackTrace = require("./stack-trace");
exports.StackTrace = StackTrace;
const Effects = require("./effect");
exports.Effects = Effects;
const DSL = require("./dsl");
exports.DSL = DSL;

},{"./commands":41,"./dsl":42,"./effect":43,"./environments":44,"./lambdas":46,"./literals":47,"./location":48,"./modules":50,"./native":51,"./packages":52,"./stack-trace":53,"./tests":54,"./types":55,"./values":56,"./world":57}],46:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_arity = exports.assert_arity = exports.prepare_activation = void 0;
const Commands = require("./commands");
const Environments = require("./environments");
const Values = require("./values");
const Location = require("./location");
const intrinsics_1 = require("../intrinsics");
const errors_1 = require("../errors");
const location_1 = require("./location");
function prepare_activation(universe, parent_activation, env0, lambda, values) {
    switch (lambda.tag) {
        case intrinsics_1.Tag.LAMBDA: {
            Values.assert_tag(intrinsics_1.Tag.LAMBDA, lambda);
            const p = lambda.payload;
            assert_arity(lambda, p.parameters.length, values.length);
            const env = Environments.extend_with_parameters_and_receiver(p.env, p.parameters, values, p.env.raw_receiver);
            const activation = new intrinsics_1.CrochetActivation(parent_activation, lambda.payload, env, intrinsics_1._return, parent_activation.handlers, p.body);
            return activation;
        }
        case intrinsics_1.Tag.PARTIAL: {
            Values.assert_tag(intrinsics_1.Tag.PARTIAL, lambda);
            const command = Commands.get_command(universe, lambda.payload.name);
            assert_arity(lambda, command.arity, values.length);
            const branch = Commands.select_branch(command, values);
            const new_activation = Commands.prepare_activation(parent_activation, branch, values);
            return new_activation;
        }
        default:
            throw new errors_1.ErrArbitrary("not-a-function", `Expected a function, but got ${Location.type_name(lambda.type)}`);
    }
}
exports.prepare_activation = prepare_activation;
function assert_arity(value, expected, got) {
    if (expected !== got) {
        throw new errors_1.ErrArbitrary("invalid-arity", `${Location.simple_value(value)} expects ${expected} arguments, but was provided with ${got}`);
    }
}
exports.assert_arity = assert_arity;
function get_arity(value) {
    switch (value.tag) {
        case intrinsics_1.Tag.LAMBDA: {
            Values.assert_tag(intrinsics_1.Tag.LAMBDA, value);
            return value.payload.parameters.length;
        }
        case intrinsics_1.Tag.PARTIAL: {
            Values.assert_tag(intrinsics_1.Tag.PARTIAL, value);
            return value.payload.arity;
        }
        default:
            throw new errors_1.ErrArbitrary(`invalid-type`, `Expected a function, but got a ${location_1.type_name(value.type)}`);
    }
}
exports.get_arity = get_arity;

},{"../errors":31,"../intrinsics":34,"./commands":41,"./environments":44,"./location":48,"./values":56}],47:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.materialise_literal = void 0;
const IR = require("../../ir");
const utils_1 = require("../../utils/utils");
const values_1 = require("./values");
function materialise_literal(universe, literal) {
    const t = IR.LiteralTag;
    switch (literal.tag) {
        case t.NOTHING:
            return values_1.get_nothing(universe);
        case t.TRUE:
            return values_1.get_true(universe);
        case t.FALSE:
            return values_1.get_false(universe);
        case t.INTEGER:
            return values_1.make_integer(universe, literal.value);
        case t.FLOAT_64:
            return values_1.make_float(universe, literal.value);
        case t.TEXT:
            return values_1.make_static_text(universe, literal.value);
        default:
            throw utils_1.unreachable(literal, `Literal`);
    }
}
exports.materialise_literal = materialise_literal;

},{"../../ir":11,"../../utils/utils":28,"./values":56}],48:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.format_position_suffix = exports.simple_activation = exports.simple_op = exports.simple_value = exports.type_name = exports.thunk_location = exports.command_signature = exports.from_suffix_newline = exports.from_suffix = exports.branch_name_location = exports.branch_location = exports.branch_name = exports.module_location = void 0;
const util_1 = require("util");
const IR = require("../../ir");
const utils_1 = require("../../utils/utils");
const intrinsics_1 = require("../intrinsics");
const meta_1 = require("./meta");
const values_1 = require("./values");
function module_location(x) {
    return `module ${x.filename} in ${x.pkg.name}`;
}
exports.module_location = module_location;
function branch_name(x) {
    return command_signature(x.name, x.types);
}
exports.branch_name = branch_name;
function branch_location(x) {
    return module_location(x.module);
}
exports.branch_location = branch_location;
function branch_name_location(x) {
    return `${branch_name(x)}, from ${branch_location(x)}`;
}
exports.branch_name_location = branch_name_location;
function from_suffix(x) {
    if (x == null) {
        return "";
    }
    else {
        return `, from ${module_location(x)}`;
    }
}
exports.from_suffix = from_suffix;
function from_suffix_newline(x) {
    if (x == null) {
        return "";
    }
    else {
        return `\n    from ${module_location(x)}`;
    }
}
exports.from_suffix_newline = from_suffix_newline;
function command_signature(name, types) {
    let i = 0;
    return name.replace(/_/g, (_) => `(${type_name(types[i++])})`);
}
exports.command_signature = command_signature;
function thunk_location(thunk) {
    const module = thunk.env.raw_module;
    if (module != null) {
        return `thunk, from ${module_location(module)}`;
    }
    else {
        return `thunk`;
    }
}
exports.thunk_location = thunk_location;
function type_name(x) {
    if (x.module != null) {
        return `${x.module.pkg.name}/${x.name}`;
    }
    else {
        return x.name;
    }
}
exports.type_name = type_name;
function simple_value(x) {
    switch (x.tag) {
        case intrinsics_1.Tag.NOTHING:
            return "nothing";
        case intrinsics_1.Tag.FALSE:
            return "false";
        case intrinsics_1.Tag.TRUE:
            return "true";
        case intrinsics_1.Tag.INTEGER: {
            values_1.assert_tag(intrinsics_1.Tag.INTEGER, x);
            return x.payload.toString();
        }
        case intrinsics_1.Tag.FLOAT_64: {
            values_1.assert_tag(intrinsics_1.Tag.FLOAT_64, x);
            return x.payload.toString() + (Number.isInteger(x.payload) ? ".0" : "");
        }
        case intrinsics_1.Tag.INSTANCE:
            return `<${type_name(x.type)}>`;
        case intrinsics_1.Tag.INTERPOLATION: {
            values_1.assert_tag(intrinsics_1.Tag.INTERPOLATION, x);
            return `i"${x.payload
                .map((x) => (typeof x === "string" ? x : `[${simple_value(x)}]`))
                .join("")}"`;
        }
        case intrinsics_1.Tag.LAMBDA: {
            values_1.assert_tag(intrinsics_1.Tag.LAMBDA, x);
            return `function(${x.payload.parameters.join(", ")})`;
        }
        case intrinsics_1.Tag.PARTIAL: {
            values_1.assert_tag(intrinsics_1.Tag.PARTIAL, x);
            return `<partial ${x.payload.name}>`;
        }
        case intrinsics_1.Tag.RECORD: {
            values_1.assert_tag(intrinsics_1.Tag.RECORD, x);
            if (x.payload.size === 0) {
                return "[->]";
            }
            const pairs = [...x.payload.entries()].map(([k, v]) => `${k} -> ${simple_value(v)}`);
            return `[${pairs.join(", ")}]`;
        }
        case intrinsics_1.Tag.TEXT: {
            return `"${x.payload}"`;
        }
        case intrinsics_1.Tag.THUNK: {
            values_1.assert_tag(intrinsics_1.Tag.THUNK, x);
            if (x.payload.value != null) {
                return `<thunk ${simple_value(x.payload.value)}>`;
            }
            else {
                return `<thunk>`;
            }
        }
        case intrinsics_1.Tag.TUPLE: {
            values_1.assert_tag(intrinsics_1.Tag.TUPLE, x);
            return `[${x.payload.map((x) => simple_value(x)).join(", ")}]`;
        }
        case intrinsics_1.Tag.TYPE: {
            values_1.assert_tag(intrinsics_1.Tag.TYPE, x);
            return `${type_name(x.type)}`;
        }
        case intrinsics_1.Tag.UNKNOWN: {
            return `<unknown>`;
        }
        case intrinsics_1.Tag.CELL: {
            values_1.assert_tag(intrinsics_1.Tag.CELL, x);
            return `<cell ${simple_value(x.payload.value)}`;
        }
        case intrinsics_1.Tag.ACTION: {
            values_1.assert_tag(intrinsics_1.Tag.ACTION, x);
            return `<action ${x.payload.action.name}>`;
        }
        case intrinsics_1.Tag.ACTION_CHOICE: {
            values_1.assert_tag(intrinsics_1.Tag.ACTION_CHOICE, x);
            return `<action choice ${x.payload.action.name} - ${x.payload.score}>`;
        }
        default:
            throw utils_1.unreachable(x.tag, `Value ${x}`);
    }
}
exports.simple_value = simple_value;
function simple_op(op, index) {
    const entries = Object.entries(op)
        .filter(([k, v]) => !["meta", "tag", "handlers"].includes(k) &&
        !(v instanceof IR.BasicBlock))
        .map((x) => util_1.inspect(x[1]));
    const bbs = Object.entries(op)
        .filter(([k, v]) => v instanceof IR.BasicBlock)
        .map(([k, v]) => `\n  ${k}:\n${v.ops
        .map((op, i) => `  ${simple_op(op, i)}`)
        .join("\n")}\n`)
        .join("\n")
        .split(/\n/g)
        .map((x) => `    ${x}`)
        .join("\n");
    const hs = (op.tag === IR.OpTag.HANDLE
        ? [
            "\n",
            ...op.handlers.map((x) => {
                return (`on ${x.effect}.${x.variant} [${x.parameters.join(", ")}]:\n` +
                    x.block.ops.map((x, i) => "  " + simple_op(x, i) + "\n").join(""));
            }),
        ]
        : [])
        .join("\n")
        .split(/\n/g)
        .map((x) => `    ${x}`)
        .join("\n");
    return `${(index ?? "").toString().padStart(3)} ${IR.OpTag[op.tag]} ${entries.join(" ")}${bbs}${hs}`;
}
exports.simple_op = simple_op;
function simple_activation(x) {
    switch (x.tag) {
        case intrinsics_1.ActivationTag.CROCHET_ACTIVATION: {
            return [
                `activation at ${x.instruction}\n`,
                x.block.ops.map((x, i) => "  " + simple_op(x, i) + "\n").join(""),
                "\nstack:\n",
                x.stack.map((x) => "  " + simple_value(x) + "\n").join(""),
            ].join("");
        }
        case intrinsics_1.ActivationTag.NATIVE_ACTIVATION: {
            if (x.location) {
                return `native activation ${x.location.name} in ${x.location.pkg.name}`;
            }
            else {
                return `native activation`;
            }
        }
    }
}
exports.simple_activation = simple_activation;
function format_position_suffix(id, meta) {
    if (meta == null) {
        return "";
    }
    else {
        const pos = meta_1.get_line_column(id, meta);
        if (pos == null) {
            return "";
        }
        else {
            return ` at line ${pos.line}`;
        }
    }
}
exports.format_position_suffix = format_position_suffix;

},{"../../ir":11,"../../utils/utils":28,"../intrinsics":34,"./meta":49,"./values":56,"util":85}],49:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_annotated_source = exports.get_line_column = void 0;
function get_line_column(id, meta) {
    const interval = meta.table.get(id);
    if (interval == null) {
        return null;
    }
    else {
        const lines = meta.source
            .slice(0, interval.range.start)
            .split(/\r\n|\r|\n/);
        const last_line = lines[lines.length - 1] ?? "";
        return { line: lines.length, column: last_line.length + 1 };
    }
}
exports.get_line_column = get_line_column;
function get_annotated_source(id, meta) {
    const pos = get_line_column(id, meta);
    if (pos == null) {
        return null;
    }
    else {
        const lines = meta.source.split(/\r\n|\r|\n/);
        const line = lines[pos.line - 1];
        if (line == null) {
            return null;
        }
        else {
            return ` ${pos.line.toString().padStart(4)} | ${line}`;
        }
    }
}
exports.get_annotated_source = get_annotated_source;

},{}],50:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_type_namespace = exports.get_define_namespace = exports.define = exports.open = void 0;
const IR = require("../../ir");
const logger_1 = require("../../utils/logger");
const errors_1 = require("../errors");
const location_1 = require("./location");
const packages_1 = require("./packages");
function open(module, namespace) {
    packages_1.assert_open_allowed(module.pkg, namespace);
    module.open_prefixes.add(namespace);
}
exports.open = open;
function define(module, visibility, name, value) {
    const ns = get_define_namespace(module, visibility);
    logger_1.logger.debug(`Defining ${IR.Visibility[visibility]} ${name} in ${location_1.module_location(module)}`);
    if (!ns.define(name, value)) {
        throw new errors_1.ErrArbitrary("duplicated-definition", `Duplicated definition ${name} in ${location_1.module_location(module)}`);
    }
}
exports.define = define;
function get_define_namespace(module, visibility) {
    switch (visibility) {
        case IR.Visibility.LOCAL:
            return module.definitions;
        case IR.Visibility.GLOBAL:
            return module.pkg.definitions;
    }
}
exports.get_define_namespace = get_define_namespace;
function get_type_namespace(module, visibility) {
    switch (visibility) {
        case IR.Visibility.LOCAL:
            return module.types;
        case IR.Visibility.GLOBAL:
            return module.pkg.types;
    }
}
exports.get_type_namespace = get_type_namespace;

},{"../../ir":11,"../../utils/logger":26,"../errors":31,"./location":48,"./packages":52}],51:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_native = exports.assert_native_tag = exports.native_tag_to_name = void 0;
const _1 = require(".");
const errors_1 = require("../errors");
const intrinsics_1 = require("../intrinsics");
function native_tag_to_name(x) {
    return intrinsics_1.NativeTag[x].toLowerCase().replace(/_/g, "-");
}
exports.native_tag_to_name = native_tag_to_name;
function assert_native_tag(tag, value) {
    if (value.tag != tag) {
        throw new errors_1.ErrArbitrary("invalid-native-function", `Expected a ${native_tag_to_name(tag)} native function, but got a ${native_tag_to_name(value.tag)} instead`);
    }
    return value;
}
exports.assert_native_tag = assert_native_tag;
function get_native(module, name) {
    const fn = module.pkg.native_functions.try_lookup(name);
    if (fn == null) {
        throw new errors_1.ErrArbitrary("undefined-foreign-function", `The foreign function ${name} is not accessible from ${_1.Location.module_location(module)}`);
    }
    return fn;
}
exports.get_native = get_native;

},{".":45,"../errors":31,"../intrinsics":34}],52:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assert_open_allowed = exports.is_open_allowed = void 0;
const errors_1 = require("../errors");
function is_open_allowed(pkg, namespace) {
    return pkg.dependencies.has(namespace);
}
exports.is_open_allowed = is_open_allowed;
function assert_open_allowed(pkg, namespace) {
    if (!is_open_allowed(pkg, namespace)) {
        throw new errors_1.ErrArbitrary("no-open-capability", `Cannot open name ${namespace} from ${pkg.name} because it's not declared as a dependency`);
    }
}
exports.assert_open_allowed = assert_open_allowed;

},{"../errors":31}],53:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.format_slice = exports.format_location = exports.format_entry = exports.format_entries = exports.collect_trace = exports.TraceEntry = void 0;
const utils_1 = require("../../utils/utils");
const intrinsics_1 = require("../intrinsics");
const location_1 = require("./location");
const meta_1 = require("./meta");
class TraceEntry {
    constructor(context, module, meta) {
        this.context = context;
        this.module = module;
        this.meta = meta;
    }
}
exports.TraceEntry = TraceEntry;
const MAX_DEPTH = 10;
function collect_trace(activation, depth = 0) {
    if (activation == null || depth > MAX_DEPTH) {
        return [];
    }
    switch (activation.tag) {
        case intrinsics_1.ActivationTag.CROCHET_ACTIVATION: {
            return [
                new TraceEntry(activation.location, activation.env.raw_module, activation.current?.meta ?? null),
                ...collect_trace(activation.parent, depth + 1),
            ];
        }
        case intrinsics_1.ActivationTag.NATIVE_ACTIVATION: {
            return [
                new TraceEntry(activation.location, null, null),
                ...collect_trace(activation.parent, depth + 1),
            ];
        }
        default:
            throw utils_1.unreachable(activation, "Activation");
    }
}
exports.collect_trace = collect_trace;
function format_entries(entries) {
    return entries.map(format_entry).join("\n");
}
exports.format_entries = format_entries;
function format_entry(entry) {
    return `  In ${format_location(entry.context)} ${format_slice(entry.module, entry.meta)}`;
}
exports.format_entry = format_entry;
function format_location(location) {
    if (location instanceof intrinsics_1.CrochetLambda) {
        return `anonymous function(${location.parameters.join(", ")})${location_1.from_suffix_newline(location.env.raw_module)}`;
    }
    else if (location instanceof intrinsics_1.CrochetCommandBranch) {
        return `${location_1.branch_name(location)}\n    from ${location_1.branch_location(location)}`;
    }
    else if (location instanceof intrinsics_1.CrochetThunk) {
        return location_1.thunk_location(location);
    }
    else if (location instanceof intrinsics_1.CrochetPrelude) {
        return `prelude${location_1.from_suffix_newline(location.env.raw_module)}`;
    }
    else if (location instanceof intrinsics_1.CrochetTest) {
        return `test "${location.title}"${location_1.from_suffix_newline(location.module)}`;
    }
    else if (location instanceof intrinsics_1.NativeFunction) {
        return `native ${location.name} in ${location.pkg.name}`;
    }
    else if (location instanceof intrinsics_1.SimulationSignal) {
        return `signal ${location.name}${location_1.from_suffix_newline(location.module)}`;
    }
    else if (location == null) {
        return `(root)`;
    }
    else {
        throw utils_1.unreachable(location, "Location");
    }
}
exports.format_location = format_location;
function format_slice(module, meta) {
    if (module == null || meta == null || module.metadata == null) {
        return "\n";
    }
    const line = meta_1.get_annotated_source(meta, module.metadata);
    if (line == null) {
        return "\n";
    }
    else {
        return `\n    ${line}\n`;
    }
}
exports.format_slice = format_slice;

},{"../../utils/utils":28,"../intrinsics":34,"./location":48,"./meta":49}],54:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.grouped_tests = exports.filter_grouped_tests = exports.add_test = void 0;
function add_test(universe, test) {
    universe.world.tests.push(test);
}
exports.add_test = add_test;
function filter_grouped_tests(tests, filter) {
    let total = 0;
    let skipped = 0;
    const result = new Map();
    for (const [group, modules] of tests) {
        const group_tests = new Map();
        for (const [module, tests] of modules) {
            const valid_tests = tests.filter(filter);
            if (valid_tests.length !== 0) {
                group_tests.set(module, valid_tests);
            }
            skipped += tests.length - valid_tests.length;
            total += valid_tests.length;
        }
        if (group_tests.size !== 0) {
            result.set(group, group_tests);
        }
    }
    return { total, skipped, tests: result };
}
exports.filter_grouped_tests = filter_grouped_tests;
function grouped_tests(universe) {
    const groups = new Map();
    for (const test of universe.world.tests) {
        const key = test.module.pkg.name;
        const module_key = test.module.filename;
        const modules = groups.get(key) ?? new Map();
        const tests = modules.get(module_key) ?? [];
        tests.push(test);
        modules.set(module_key, tests);
        groups.set(key, modules);
    }
    return groups;
}
exports.grouped_tests = grouped_tests;

},{}],55:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registered_instances = exports.seal = exports.compare = exports.distance = exports.get_function_type = exports.define_type = exports.get_foreign_type = exports.materialise_type = exports.get_type_namespaced = exports.get_type = exports.get_static_type = exports.is_subtype = void 0;
const IR = require("../../ir");
const utils_1 = require("../../utils/utils");
const errors_1 = require("../errors");
const intrinsics_1 = require("../intrinsics");
const Location = require("./location");
const modules_1 = require("./modules");
function is_subtype(type, parent) {
    if (type === parent) {
        return true;
    }
    else if (type.parent != null) {
        return is_subtype(type.parent, parent);
    }
    else {
        return false;
    }
}
exports.is_subtype = is_subtype;
function get_static_type(universe, type) {
    if (type.is_static) {
        return type;
    }
    const cached = universe.type_cache.get(type);
    if (cached != null) {
        return cached;
    }
    else {
        const name = `#${type.name}`;
        const static_type = new intrinsics_1.CrochetType(type.module, name, "", universe.types.Type, [], [], true, null);
        universe.type_cache.set(type, static_type);
        return static_type;
    }
}
exports.get_static_type = get_static_type;
function get_type(module, name) {
    const value = module.types.try_lookup(name);
    if (value != null) {
        return value;
    }
    else {
        throw new errors_1.ErrArbitrary("no-type", `No type ${name} is accessible from ${Location.module_location(module)}`);
    }
}
exports.get_type = get_type;
function get_type_namespaced(module, namespace, name) {
    const value = module.types.try_lookup_namespaced(namespace, name);
    if (value != null) {
        return value;
    }
    else {
        throw new errors_1.ErrArbitrary("no-type", `No type ${namespace}/${name} is accessible from ${Location.module_location(module)}`);
    }
}
exports.get_type_namespaced = get_type_namespaced;
function materialise_type(universe, module, type) {
    switch (type.tag) {
        case IR.TypeTag.ANY:
            return universe.types.Any;
        case IR.TypeTag.UNKNOWN:
            return universe.types.Unknown;
        case IR.TypeTag.LOCAL: {
            return get_type(module, type.name);
        }
        case IR.TypeTag.LOCAL_STATIC: {
            const value = get_type(module, type.name);
            return get_static_type(universe, value);
        }
        case IR.TypeTag.GLOBAL: {
            return get_type_namespaced(module, type.namespace, type.name);
        }
        default:
            throw utils_1.unreachable(type, "Type");
    }
}
exports.materialise_type = materialise_type;
function get_foreign_type(universe, module, name) {
    const result = universe.world.native_types.try_lookup_namespaced(module.pkg.name, name);
    if (result == null) {
        throw new errors_1.ErrArbitrary("no-foreign-type", `No foreign type ${name} is accessible from ${Location.module_location(module)}`);
    }
    return result;
}
exports.get_foreign_type = get_foreign_type;
function define_type(module, name, type, visibility) {
    const ns = modules_1.get_type_namespace(module, visibility);
    if (!ns.define(name, type)) {
        throw new errors_1.ErrArbitrary("duplicated-type", `Duplicated definition of type ${name} in ${Location.module_location(module)}`);
    }
}
exports.define_type = define_type;
function get_function_type(universe, arity) {
    const type = universe.types.Function[arity];
    if (type != null) {
        return type;
    }
    else {
        throw new errors_1.ErrArbitrary("invalid-function", `internal: Functions of arity ${arity} are not currently supported`);
    }
}
exports.get_function_type = get_function_type;
function distance(type) {
    if (type.parent == null) {
        return 0;
    }
    else {
        return 1 + distance(type.parent);
    }
}
exports.distance = distance;
function compare(t1, t2) {
    return distance(t2) - distance(t1);
}
exports.compare = compare;
function seal(type) {
    type.sealed = true;
}
exports.seal = seal;
function* registered_instances(universe, type) {
    const instances = universe.registered_instances.get(type) ?? [];
    yield* instances;
    for (const sub_type of type.sub_types) {
        yield* registered_instances(universe, sub_type);
    }
}
exports.registered_instances = registered_instances;

},{"../../ir":11,"../../utils/utils":28,"../errors":31,"../intrinsics":34,"./location":48,"./modules":50}],56:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.is_nothing = exports.to_number = exports.float_to_number = exports.from_plain_object = exports.to_plain_object = exports.unbox = exports.box = exports.is_boxed = exports.update_thunk = exports.is_thunk_forced = exports.normalise_interpolation = exports.get_map = exports.update_cell = exports.deref_cell = exports.make_cell = exports.project = exports.text_to_string = exports.register_instance = exports.equals = exports.get_interpolation_parts = exports.get_array = exports.make_boolean = exports.get_boolean = exports.get_thunk = exports.assert_tag = exports.tag_to_name = exports.make_static_type = exports.instantiate = exports.has_type = exports.record_at_put = exports.get_action_choice = exports.make_action_choice = exports.get_action = exports.make_action = exports.make_record_from_map = exports.make_record = exports.make_partial = exports.make_lambda = exports.make_thunk = exports.make_interpolation = exports.make_tuple = exports.make_static_text = exports.make_text = exports.make_float = exports.make_integer = exports.get_true = exports.get_false = exports.get_nothing = void 0;
const utils_1 = require("../../utils/utils");
const errors_1 = require("../errors");
const intrinsics_1 = require("../intrinsics");
const location_1 = require("./location");
const types_1 = require("./types");
function get_nothing(universe) {
    return universe.nothing;
}
exports.get_nothing = get_nothing;
function get_false(universe) {
    return universe.false;
}
exports.get_false = get_false;
function get_true(universe) {
    return universe.true;
}
exports.get_true = get_true;
function make_integer(universe, x) {
    return universe.make_integer(x);
}
exports.make_integer = make_integer;
function make_float(universe, x) {
    return universe.make_float(x);
}
exports.make_float = make_float;
function make_text(universe, x) {
    return new intrinsics_1.CrochetValue(intrinsics_1.Tag.TEXT, universe.types.Text, x);
}
exports.make_text = make_text;
function make_static_text(universe, x) {
    return new intrinsics_1.CrochetValue(intrinsics_1.Tag.TEXT, universe.types.StaticText, x);
}
exports.make_static_text = make_static_text;
function make_tuple(universe, xs) {
    return new intrinsics_1.CrochetValue(intrinsics_1.Tag.TUPLE, universe.types.Tuple, xs);
}
exports.make_tuple = make_tuple;
function make_interpolation(universe, xs) {
    return new intrinsics_1.CrochetValue(intrinsics_1.Tag.INTERPOLATION, universe.types.Interpolation, xs);
}
exports.make_interpolation = make_interpolation;
function make_thunk(universe, env, block) {
    return new intrinsics_1.CrochetValue(intrinsics_1.Tag.THUNK, universe.types.Thunk, new intrinsics_1.CrochetThunk(env, block));
}
exports.make_thunk = make_thunk;
function make_lambda(universe, env, parameters, body) {
    return new intrinsics_1.CrochetValue(intrinsics_1.Tag.LAMBDA, types_1.get_function_type(universe, parameters.length), new intrinsics_1.CrochetLambda(env, parameters, body));
}
exports.make_lambda = make_lambda;
function make_partial(universe, module, name, arity) {
    return new intrinsics_1.CrochetValue(intrinsics_1.Tag.PARTIAL, types_1.get_function_type(universe, arity), new intrinsics_1.CrochetPartial(module, name, arity));
}
exports.make_partial = make_partial;
function make_record(universe, keys, values) {
    return new intrinsics_1.CrochetValue(intrinsics_1.Tag.RECORD, universe.types.Record, new Map(utils_1.zip(keys, values)));
}
exports.make_record = make_record;
function make_record_from_map(universe, value) {
    return new intrinsics_1.CrochetValue(intrinsics_1.Tag.RECORD, universe.types.Record, value);
}
exports.make_record_from_map = make_record_from_map;
function make_action(action, env) {
    return new intrinsics_1.CrochetValue(intrinsics_1.Tag.ACTION, action.type, { env, action });
}
exports.make_action = make_action;
function get_action(value) {
    assert_tag(intrinsics_1.Tag.ACTION, value);
    return value.payload;
}
exports.get_action = get_action;
function make_action_choice(universe, choice) {
    return new intrinsics_1.CrochetValue(intrinsics_1.Tag.ACTION_CHOICE, universe.types.ActionChoice, choice);
}
exports.make_action_choice = make_action_choice;
function get_action_choice(value) {
    assert_tag(intrinsics_1.Tag.ACTION_CHOICE, value);
    return value.payload;
}
exports.get_action_choice = get_action_choice;
function record_at_put(universe, record, key, value) {
    assert_tag(intrinsics_1.Tag.RECORD, record);
    const map0 = record.payload;
    const map = utils_1.clone_map(map0);
    map.set(key, value);
    return new intrinsics_1.CrochetValue(intrinsics_1.Tag.RECORD, universe.types.Record, map);
}
exports.record_at_put = record_at_put;
function has_type(type, value) {
    return types_1.is_subtype(value.type, type);
}
exports.has_type = has_type;
function instantiate(type, values) {
    if (type.sealed) {
        throw new errors_1.ErrArbitrary("new-on-sealed-type", `The type ${location_1.type_name(type)} cannot be instantiated`);
    }
    if (type.fields.length !== values.length) {
        throw new errors_1.ErrArbitrary("invalid-new-arity", `The type ${location_1.type_name(type)} requires ${type.fields.length} arguments (${type.fields.join(", ")})`);
    }
    for (const [f, t, v] of utils_1.zip3(type.fields, type.types, values)) {
        if (!has_type(t, v)) {
            throw new errors_1.ErrArbitrary("invalid-field-type", `The field ${f} of type ${location_1.type_name(type)} expects a value of type ${location_1.type_name(t)}, but was provided a value of type ${location_1.type_name(v.type)}`);
        }
    }
    return new intrinsics_1.CrochetValue(intrinsics_1.Tag.INSTANCE, type, values);
}
exports.instantiate = instantiate;
function make_static_type(type) {
    if (!type.is_static) {
        throw new errors_1.ErrArbitrary("no-static-type", `The operation tried to construct a static type value, but wasn't provided with a static type`);
    }
    return new intrinsics_1.CrochetValue(intrinsics_1.Tag.TYPE, type, type);
}
exports.make_static_type = make_static_type;
function tag_to_name(x) {
    return intrinsics_1.Tag[x].replace(/_/g, "-").toLowerCase();
}
exports.tag_to_name = tag_to_name;
function assert_tag(tag, value) {
    if (value.tag !== tag) {
        throw new errors_1.ErrArbitrary("invalid-type", `Expected a value of type ${tag_to_name(tag)}, but got ${location_1.type_name(value.type)}`);
    }
    else {
        return value;
    }
}
exports.assert_tag = assert_tag;
function get_thunk(x) {
    assert_tag(intrinsics_1.Tag.THUNK, x);
    return x.payload;
}
exports.get_thunk = get_thunk;
function get_boolean(x) {
    switch (x.tag) {
        case intrinsics_1.Tag.FALSE:
            return false;
        case intrinsics_1.Tag.TRUE:
            return true;
        default:
            throw new errors_1.ErrArbitrary("invalid-type", `Expected true or false, but got a value of type ${location_1.type_name(x.type)} instead`);
    }
}
exports.get_boolean = get_boolean;
function make_boolean(universe, x) {
    return x ? get_true(universe) : get_false(universe);
}
exports.make_boolean = make_boolean;
function get_array(x) {
    assert_tag(intrinsics_1.Tag.TUPLE, x);
    return x.payload;
}
exports.get_array = get_array;
function get_interpolation_parts(x) {
    assert_tag(intrinsics_1.Tag.INTERPOLATION, x);
    return x.payload;
}
exports.get_interpolation_parts = get_interpolation_parts;
function equals(left, right) {
    if (left.tag !== right.tag) {
        return false;
    }
    switch (left.tag) {
        case intrinsics_1.Tag.NOTHING:
        case intrinsics_1.Tag.TRUE:
        case intrinsics_1.Tag.FALSE:
            return left.tag === right.tag;
        case intrinsics_1.Tag.INTEGER: {
            assert_tag(intrinsics_1.Tag.INTEGER, left);
            assert_tag(intrinsics_1.Tag.INTEGER, right);
            return left.payload === right.payload;
        }
        case intrinsics_1.Tag.FLOAT_64: {
            assert_tag(intrinsics_1.Tag.FLOAT_64, left);
            assert_tag(intrinsics_1.Tag.FLOAT_64, right);
            return left.payload === right.payload;
        }
        case intrinsics_1.Tag.PARTIAL: {
            assert_tag(intrinsics_1.Tag.PARTIAL, left);
            assert_tag(intrinsics_1.Tag.PARTIAL, right);
            return (left.payload.module === right.payload.module &&
                left.payload.name === right.payload.name);
        }
        case intrinsics_1.Tag.TEXT: {
            assert_tag(intrinsics_1.Tag.TEXT, left);
            assert_tag(intrinsics_1.Tag.TEXT, right);
            return left.payload === right.payload;
        }
        case intrinsics_1.Tag.INTERPOLATION: {
            assert_tag(intrinsics_1.Tag.INTERPOLATION, left);
            assert_tag(intrinsics_1.Tag.INTERPOLATION, right);
            return (left.payload.length === right.payload.length &&
                utils_1.every(utils_1.zip(left.payload, right.payload), ([l, r]) => {
                    if (typeof l === "string" && typeof r === "string") {
                        return l === r;
                    }
                    else if (l instanceof intrinsics_1.CrochetValue && r instanceof intrinsics_1.CrochetValue) {
                        return equals(l, r);
                    }
                    else {
                        return false;
                    }
                }));
        }
        case intrinsics_1.Tag.TUPLE: {
            assert_tag(intrinsics_1.Tag.TUPLE, left);
            assert_tag(intrinsics_1.Tag.TUPLE, right);
            return (left.payload.length === right.payload.length &&
                utils_1.every(utils_1.zip(left.payload, right.payload), ([l, r]) => equals(l, r)));
        }
        case intrinsics_1.Tag.RECORD: {
            assert_tag(intrinsics_1.Tag.RECORD, left);
            assert_tag(intrinsics_1.Tag.RECORD, right);
            if (left.payload.size !== right.payload.size) {
                return false;
            }
            for (const [k, v] of left.payload.entries()) {
                const rv = right.payload.get(k);
                if (rv == null) {
                    return false;
                }
                else if (!equals(v, rv)) {
                    return false;
                }
            }
            return true;
        }
        default:
            return left === right;
    }
}
exports.equals = equals;
function register_instance(universe, value) {
    const current = universe.registered_instances.get(value.type) ?? [];
    if (current.some((x) => equals(x, value))) {
        throw new errors_1.ErrArbitrary("instance-already-registered", `The instance ${location_1.simple_value(value)} is already registered`);
    }
    current.push(value);
    universe.registered_instances.set(value.type, current);
}
exports.register_instance = register_instance;
function text_to_string(x) {
    assert_tag(intrinsics_1.Tag.TEXT, x);
    return x.payload;
}
exports.text_to_string = text_to_string;
function project(value, key) {
    switch (value.tag) {
        case intrinsics_1.Tag.RECORD: {
            assert_tag(intrinsics_1.Tag.RECORD, value);
            const x = value.payload.get(key);
            if (x == null) {
                throw new errors_1.ErrArbitrary("no-record-key", `The key ${key} does not exist in the record (${[
                    ...value.payload.keys(),
                ].join(", ")})`);
            }
            else {
                return x;
            }
        }
        case intrinsics_1.Tag.INSTANCE: {
            assert_tag(intrinsics_1.Tag.INSTANCE, value);
            const index = value.type.layout.get(key);
            if (index == null) {
                throw new errors_1.ErrArbitrary("no-type-key", `The type ${location_1.type_name(value.type)} does not have a field ${key} ([${value.type.fields.join(", ")}])`);
            }
            else {
                const result = value.payload[index];
                if (result == null) {
                    throw new errors_1.ErrArbitrary("internal", `The data in the value does not match its type (${location_1.type_name(value.type)}) layout`);
                }
                return result;
            }
        }
        case intrinsics_1.Tag.TUPLE: {
            assert_tag(intrinsics_1.Tag.TUPLE, value);
            const results = value.payload.map((x) => project(x, key));
            return new intrinsics_1.CrochetValue(intrinsics_1.Tag.TUPLE, value.type, results);
        }
        case intrinsics_1.Tag.ACTION: {
            assert_tag(intrinsics_1.Tag.ACTION, value);
            const result = value.payload.env.try_lookup(key);
            if (result == null) {
                throw new errors_1.ErrArbitrary("no-bound-variable", `The name ${key} is not bound in the action ${value.payload.action.name}`);
            }
            return result;
        }
        default:
            throw new errors_1.ErrArbitrary("no-projection-capability", `Values of type ${location_1.type_name(value.type)} do not support projection`);
    }
}
exports.project = project;
function make_cell(universe, value) {
    return new intrinsics_1.CrochetValue(intrinsics_1.Tag.CELL, universe.types.Cell, new intrinsics_1.CrochetCell(value));
}
exports.make_cell = make_cell;
function deref_cell(cell) {
    assert_tag(intrinsics_1.Tag.CELL, cell);
    return cell.payload.value;
}
exports.deref_cell = deref_cell;
function update_cell(cell, old_value, value) {
    assert_tag(intrinsics_1.Tag.CELL, cell);
    if (equals(cell.payload.value, old_value)) {
        cell.payload.value = value;
        return true;
    }
    else {
        return false;
    }
}
exports.update_cell = update_cell;
function get_map(x) {
    assert_tag(intrinsics_1.Tag.RECORD, x);
    return x.payload;
}
exports.get_map = get_map;
function normalise_interpolation(universe, x) {
    assert_tag(intrinsics_1.Tag.INTERPOLATION, x);
    let last = null;
    const list = [];
    for (const p of x.payload) {
        if (typeof p === "string") {
            if (typeof last === "string") {
                last = last + p;
            }
            else {
                last = p;
            }
        }
        else {
            if (last != null) {
                list.push(last);
                last = null;
            }
            list.push(p);
        }
    }
    if (last != null) {
        list.push(last);
    }
    return make_interpolation(universe, list);
}
exports.normalise_interpolation = normalise_interpolation;
function is_thunk_forced(x) {
    assert_tag(intrinsics_1.Tag.THUNK, x);
    return x.payload.value != null;
}
exports.is_thunk_forced = is_thunk_forced;
function update_thunk(x, value) {
    x.value = value;
}
exports.update_thunk = update_thunk;
function is_boxed(x) {
    return x.tag === intrinsics_1.Tag.UNKNOWN;
}
exports.is_boxed = is_boxed;
function box(universe, x) {
    if (x instanceof intrinsics_1.CrochetValue && is_boxed(x)) {
        return x;
    }
    else {
        return new intrinsics_1.CrochetValue(intrinsics_1.Tag.UNKNOWN, universe.types.Unknown, x);
    }
}
exports.box = box;
function unbox(x) {
    assert_tag(intrinsics_1.Tag.UNKNOWN, x);
    return x.payload;
}
exports.unbox = unbox;
function to_plain_object(x) {
    switch (x.tag) {
        case intrinsics_1.Tag.NOTHING:
            return null;
        case intrinsics_1.Tag.INTEGER:
            return x.payload;
        case intrinsics_1.Tag.FLOAT_64:
            return x.payload;
        case intrinsics_1.Tag.TEXT:
            return x.payload;
        case intrinsics_1.Tag.TRUE:
            return true;
        case intrinsics_1.Tag.FALSE:
            return false;
        case intrinsics_1.Tag.TUPLE:
            assert_tag(intrinsics_1.Tag.TUPLE, x);
            return x.payload.map((x) => to_plain_object(x));
        case intrinsics_1.Tag.RECORD: {
            assert_tag(intrinsics_1.Tag.RECORD, x);
            const result = new Map();
            for (const [k, v] of x.payload.entries()) {
                result.set(k, to_plain_object(v));
            }
            return result;
        }
        default:
            throw new errors_1.ErrArbitrary(`no-conversion-to-native`, `No conversion supported for values of type ${location_1.type_name(x.type)}`);
    }
}
exports.to_plain_object = to_plain_object;
function from_plain_object(universe, x) {
    if (x == null) {
        return universe.nothing;
    }
    else if (typeof x === "string") {
        return make_text(universe, x);
    }
    else if (typeof x === "bigint") {
        return make_integer(universe, x);
    }
    else if (typeof x === "number") {
        return make_float(universe, x);
    }
    else if (typeof x === "boolean") {
        return make_boolean(universe, x);
    }
    else if (Array.isArray(x)) {
        return make_tuple(universe, x.map((x) => from_plain_object(universe, x)));
    }
    else if (x instanceof Map) {
        const result = new Map();
        for (const [k, v] of x.entries()) {
            if (typeof k !== "string") {
                throw new errors_1.ErrArbitrary("invalid-type", `Cannot convert native map because it has non-text keys`);
            }
            result.set(k, from_plain_object(universe, v));
        }
        return make_record_from_map(universe, result);
    }
    else {
        throw new errors_1.ErrArbitrary("no-conversion-from-native", `Conversions are only supported for plain native types`);
    }
}
exports.from_plain_object = from_plain_object;
function float_to_number(x) {
    assert_tag(intrinsics_1.Tag.FLOAT_64, x);
    return x.payload;
}
exports.float_to_number = float_to_number;
function to_number(x) {
    switch (x.tag) {
        case intrinsics_1.Tag.FLOAT_64: {
            assert_tag(intrinsics_1.Tag.FLOAT_64, x);
            return x.payload;
        }
        case intrinsics_1.Tag.INTEGER: {
            assert_tag(intrinsics_1.Tag.INTEGER, x);
            return Number(x.payload);
        }
        default:
            throw new errors_1.ErrArbitrary("invalid-type", `Expected a numeric value`);
    }
}
exports.to_number = to_number;
function is_nothing(x) {
    return x.tag === intrinsics_1.Tag.NOTHING;
}
exports.is_nothing = is_nothing;

},{"../../utils/utils":28,"../errors":31,"../intrinsics":34,"./location":48,"./types":55}],57:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_or_make_package = exports.add_prelude = void 0;
const intrinsics_1 = require("../intrinsics");
function add_prelude(world, prelude) {
    world.prelude.push(prelude);
}
exports.add_prelude = add_prelude;
function get_or_make_package(world, pkg) {
    const result = world.packages.get(pkg.name);
    if (result != null) {
        return result;
    }
    else {
        const cpkg = new intrinsics_1.CrochetPackage(world, pkg.name, pkg.filename);
        for (const dep of pkg.dependencies) {
            cpkg.dependencies.add(dep.name);
        }
        world.packages.set(pkg.name, cpkg);
        return cpkg;
    }
}
exports.get_or_make_package = get_or_make_package;

},{"../intrinsics":34}],58:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run_native = exports.run_native_sync = exports.run_block = exports.run_test = exports.run_prelude = exports.run_command = void 0;
const IR = require("../ir");
const evaluation_1 = require("./evaluation");
const intrinsics_1 = require("./intrinsics");
async function run_command(universe, name, args) {
    const env = new intrinsics_1.Environment(null, null, null, null);
    const activation = new intrinsics_1.CrochetActivation(null, null, env, intrinsics_1._done, new intrinsics_1.HandlerStack(null, []), new IR.BasicBlock([new IR.Invoke(0, name, args.length), new IR.Return(0)]));
    const state = new intrinsics_1.State(universe, activation, universe.random);
    activation.stack.push.apply(activation.stack, args);
    const thread = new evaluation_1.Thread(state);
    const value = await thread.run_to_completion();
    return value;
}
exports.run_command = run_command;
async function run_prelude(universe) {
    for (const x of universe.world.prelude) {
        const activation = new intrinsics_1.CrochetActivation(null, x, x.env, intrinsics_1._done, new intrinsics_1.HandlerStack(null, []), x.body);
        const state = new intrinsics_1.State(universe, activation, universe.random);
        const thread = new evaluation_1.Thread(state);
        await thread.run_to_completion();
    }
}
exports.run_prelude = run_prelude;
async function run_test(universe, test) {
    const env = new intrinsics_1.Environment(test.env, null, test.module, null);
    const activation = new intrinsics_1.CrochetActivation(null, test, env, intrinsics_1._done, new intrinsics_1.HandlerStack(null, []), test.body);
    const state = new intrinsics_1.State(universe, activation, universe.random);
    const thread = new evaluation_1.Thread(state);
    const value = await thread.run_to_completion();
    return value;
}
exports.run_test = run_test;
async function run_block(universe, env, block) {
    const activation = new intrinsics_1.CrochetActivation(null, null, env, intrinsics_1._done, new intrinsics_1.HandlerStack(null, []), block);
    const state = new intrinsics_1.State(universe, activation, universe.random);
    const thread = new evaluation_1.Thread(state);
    const value = await thread.run_to_completion();
    return value;
}
exports.run_block = run_block;
function run_native_sync(universe, env, pkg, machine) {
    const fn = new intrinsics_1.NativeFunction(intrinsics_1.NativeTag.NATIVE_MACHINE, "(native)", pkg, () => machine);
    const activation = new intrinsics_1.NativeActivation(null, fn, env, machine, new intrinsics_1.HandlerStack(null, []), intrinsics_1._done);
    const state = new intrinsics_1.State(universe, activation, universe.random);
    const thread = new evaluation_1.Thread(state);
    const value = thread.run_synchronous();
    return value;
}
exports.run_native_sync = run_native_sync;
async function run_native(universe, env, pkg, machine) {
    const fn = new intrinsics_1.NativeFunction(intrinsics_1.NativeTag.NATIVE_MACHINE, "(native)", pkg, () => machine);
    const activation = new intrinsics_1.NativeActivation(null, fn, env, machine, new intrinsics_1.HandlerStack(null, []), intrinsics_1._done);
    const state = new intrinsics_1.State(universe, activation, universe.random);
    const thread = new evaluation_1.Thread(state);
    const value = await thread.run_to_completion();
    return value;
}
exports.run_native = run_native;

},{"../ir":11,"./evaluation":32,"./intrinsics":34}],59:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mark_action_fired = exports.available_events = exports.available_actions = exports.add_event = exports.add_action = exports.define_context = exports.lookup_context = void 0;
const errors_1 = require("../errors");
const intrinsics_1 = require("../intrinsics");
const logic_1 = require("../logic");
const primitives_1 = require("../primitives");
const location_1 = require("../primitives/location");
function lookup_context(module, name) {
    if (name == null) {
        return module.pkg.world.global_context;
    }
    const context = module.contexts.try_lookup(name);
    if (context == null) {
        throw new errors_1.ErrArbitrary("undefined-context", `The context ${name} is not accessible from ${location_1.module_location(module)}`);
    }
    return context;
}
exports.lookup_context = lookup_context;
function define_context(module, context) {
    const result = module.pkg.contexts.define(context.name, context);
    if (!result) {
        throw new errors_1.ErrArbitrary(`duplicated-context`, `The context ${context.name} already exists in package ${module.pkg.name}`);
    }
    return result;
}
exports.define_context = define_context;
function add_action(module, context, action) {
    const result = module.pkg.actions.define(action.name, action);
    if (!result) {
        throw new errors_1.ErrArbitrary(`duplicated-action`, `The action ${action.name} already exists in package ${module.pkg.name}`);
    }
    context.actions.push(action);
}
exports.add_action = add_action;
function add_event(context, event) {
    context.events.push(event);
}
exports.add_event = add_event;
function* available_actions(context, state, env0, module, random, relations, actor) {
    const result = [];
    for (const action of context.actions) {
        if (!primitives_1.Values.has_type(action.actor_type, actor)) {
            continue;
        }
        const env = primitives_1.Environments.clone(env0);
        env.define(action.self_parameter, actor);
        const envs = yield* logic_1.search(state, env, module, random, relations, action.predicate);
        for (const e0 of envs) {
            const e1 = primitives_1.Environments.clone(e0);
            const score0 = yield new intrinsics_1.NSEvaluate(e1, action.rank_function);
            const score = primitives_1.Values.to_number(score0);
            result.push({
                action: action,
                env: e0,
                score: score,
            });
        }
    }
    return result;
}
exports.available_actions = available_actions;
function* available_events(context, state, env, module, random, relations) {
    const result = [];
    for (const event of context.events) {
        const envs = yield* logic_1.search(state, env, module, random, relations, event.predicate);
        for (const e of envs) {
            result.push({ event: event, env: e });
        }
    }
    return result;
}
exports.available_events = available_events;
function mark_action_fired(action, actor) {
    action.fired.add(actor);
}
exports.mark_action_fired = mark_action_fired;

},{"../errors":31,"../intrinsics":34,"../logic":35,"../primitives":45,"../primitives/location":48}],60:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contexts = void 0;
const Contexts = require("./contexts");
exports.Contexts = Contexts;

},{"./contexts":59}],61:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run_simulation = void 0;
const IR = require("../../ir");
const logger_1 = require("../../utils/logger");
const utils_1 = require("../../utils/utils");
const intrinsics_1 = require("../intrinsics");
const primitives_1 = require("../primitives");
const contexts_1 = require("./contexts");
const logic_1 = require("../logic");
function* run_simulation(state) {
    const relations = setup_relations(state);
    state.rounds = 0n;
    while (true) {
        const active = yield* run_turn(state, relations);
        if (!active) {
            break;
        }
        state.rounds += 1n;
    }
    return primitives_1.Values.get_nothing(state.state.universe);
}
exports.run_simulation = run_simulation;
function* run_turn(state, relations) {
    let actions_fired = 0;
    let events_fired = 0;
    state.acted.clear();
    let actor = yield* next_actor(state);
    while (actor != null) {
        state.turn = actor;
        logger_1.logger.debug(`New turn ${primitives_1.Location.simple_value(actor)}`);
        const action = yield* pick_action(state, actor, relations);
        if (action != null) {
            actions_fired += 1;
            contexts_1.mark_action_fired(action.action, actor);
            logger_1.logger.debug(`Running action ${action.action.name}`);
            yield new intrinsics_1.NSEvaluate(action.env, action.action.body);
            const reactions = yield* contexts_1.available_events(state.context, state.state, state.env, state.module, state.random, relations);
            for (const reaction of reactions) {
                events_fired += 1;
                yield new intrinsics_1.NSEvaluate(reaction.env, reaction.event.body);
            }
        }
        state.acted.add(actor);
        const next_turn = yield* next_actor(state);
        const ended = yield* check_goal(state, actions_fired, events_fired, next_turn == null);
        logger_1.logger.debug(`Checked goal ${ended}`);
        logger_1.logger.debug(`Next turn ${primitives_1.Location.simple_value(next_turn ?? primitives_1.Values.get_nothing(state.state.universe))}`);
        if (ended) {
            return false;
        }
        else {
            actor = next_turn;
        }
    }
    return actions_fired > 0;
}
function* next_actor(state) {
    const remaining = state.actors.filter((x) => !state.acted.has(x));
    if (remaining.length === 0) {
        return null;
    }
    else {
        return remaining[0];
    }
}
function* pick_action(state, actor, relations) {
    const actions = yield* contexts_1.available_actions(state.context, state.state, state.env, state.module, state.random, relations, actor);
    const sorted_actions = actions.sort((a, b) => a.score - b.score);
    const signal = state.signals.try_lookup("pick-action: _ for: _");
    if (signal == null) {
        const choices = sorted_actions.map((x) => [x.score, x]);
        return state.random.random_weighted_choice(choices);
    }
    else {
        const choices = sorted_actions.map((x) => make_action_choice(state, x));
        const args = [primitives_1.Values.make_tuple(state.state.universe, choices), actor];
        const choice0 = yield* trigger_signal(state, signal, args);
        if (choice0.tag === intrinsics_1.Tag.NOTHING) {
            return null;
        }
        else {
            const choice = primitives_1.Values.get_action_choice(choice0);
            return choice;
        }
    }
}
function make_action_choice(state, choice) {
    const universe = state.state.universe;
    return primitives_1.Values.make_action_choice(universe, choice);
}
function* trigger_signal(state, signal, args) {
    const env = primitives_1.Environments.clone(state.env);
    for (const [k, v] of utils_1.zip(signal.parameters, args)) {
        env.define(k, v);
    }
    const result = yield new intrinsics_1.NSJump((parent) => new intrinsics_1.CrochetActivation(parent, signal, env, intrinsics_1._return, parent.handlers, signal.body));
    return result;
}
function* check_goal(state, actions, events, round_ended) {
    const goal = state.goal;
    switch (goal.tag) {
        case IR.SimulationGoalTag.ACTION_QUIESCENCE:
            return round_ended && actions === 0;
        case IR.SimulationGoalTag.EVENT_QUIESCENCE:
            return round_ended && events === 0;
        case IR.SimulationGoalTag.TOTAL_QUIESCENCE:
            return round_ended && events === 0 && actions === 0;
        case IR.SimulationGoalTag.PREDICATE: {
            const env = primitives_1.Environments.clone(state.env);
            const results = yield* logic_1.search(state.state, env, state.module, state.random, state.module.relations, goal.predicate);
            return results.length !== 0;
        }
        default:
            throw utils_1.unreachable(goal, `Goal`);
    }
}
function setup_relations(state) {
    return logic_1.Relation.make_functional_layer(state.module, new Map([
        [
            "_ simulate-turn",
            new intrinsics_1.ProceduralRelation((env, [pattern]) => {
                if (state.turn == null) {
                    return [];
                }
                else {
                    return logic_1.unify_all(state.state, state.module, env, [state.turn], pattern);
                }
            }, null),
        ],
        [
            "_ simulate-rounds-elapsed",
            new intrinsics_1.ProceduralRelation((env, [pattern]) => {
                const rounds = primitives_1.Values.make_integer(state.state.universe, state.rounds);
                return logic_1.unify_all(state.state, state.module, env, [rounds], pattern);
            }, null),
        ],
    ]));
}

},{"../../ir":11,"../../utils/logger":26,"../../utils/utils":28,"../intrinsics":34,"../logic":35,"../primitives":45,"./contexts":59}],62:[function(require,module,exports){

/**
 * Array#filter.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Object=} self
 * @return {Array}
 * @throw TypeError
 */

module.exports = function (arr, fn, self) {
  if (arr.filter) return arr.filter(fn, self);
  if (void 0 === arr || null === arr) throw new TypeError;
  if ('function' != typeof fn) throw new TypeError;
  var ret = [];
  for (var i = 0; i < arr.length; i++) {
    if (!hasOwn.call(arr, i)) continue;
    var val = arr[i];
    if (fn.call(self, val, i, arr)) ret.push(val);
  }
  return ret;
};

var hasOwn = Object.prototype.hasOwnProperty;

},{}],63:[function(require,module,exports){
(function (global){(function (){
'use strict';

var filter = require('array-filter');

module.exports = function availableTypedArrays() {
	return filter([
		'BigInt64Array',
		'BigUint64Array',
		'Float32Array',
		'Float64Array',
		'Int16Array',
		'Int32Array',
		'Int8Array',
		'Uint16Array',
		'Uint32Array',
		'Uint8Array',
		'Uint8ClampedArray'
	], function (typedArray) {
		return typeof global[typedArray] === 'function';
	});
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"array-filter":62}],64:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],65:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":64,"buffer":65,"ieee754":76}],66:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var callBind = require('./');

var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'));

module.exports = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
		return callBind(intrinsic);
	}
	return intrinsic;
};

},{"./":67,"get-intrinsic":72}],67:[function(require,module,exports){
'use strict';

var bind = require('function-bind');
var GetIntrinsic = require('get-intrinsic');

var $apply = GetIntrinsic('%Function.prototype.apply%');
var $call = GetIntrinsic('%Function.prototype.call%');
var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);
var $max = GetIntrinsic('%Math.max%');

if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = null;
	}
}

module.exports = function callBind(originalFunction) {
	var func = $reflectApply(bind, $call, arguments);
	if ($gOPD && $defineProperty) {
		var desc = $gOPD(func, 'length');
		if (desc.configurable) {
			// original length, plus the receiver, minus any additional arguments (after the receiver)
			$defineProperty(
				func,
				'length',
				{ value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
			);
		}
	}
	return func;
};

var applyBind = function applyBind() {
	return $reflectApply(bind, $apply, arguments);
};

if ($defineProperty) {
	$defineProperty(module.exports, 'apply', { value: applyBind });
} else {
	module.exports.apply = applyBind;
}

},{"function-bind":71,"get-intrinsic":72}],68:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%');
if ($gOPD) {
	try {
		$gOPD([], 'length');
	} catch (e) {
		// IE 8 has a broken gOPD
		$gOPD = null;
	}
}

module.exports = $gOPD;

},{"get-intrinsic":72}],69:[function(require,module,exports){

var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

module.exports = function forEach (obj, fn, ctx) {
    if (toString.call(fn) !== '[object Function]') {
        throw new TypeError('iterator must be a function');
    }
    var l = obj.length;
    if (l === +l) {
        for (var i = 0; i < l; i++) {
            fn.call(ctx, obj[i], i, obj);
        }
    } else {
        for (var k in obj) {
            if (hasOwn.call(obj, k)) {
                fn.call(ctx, obj[k], k, obj);
            }
        }
    }
};


},{}],70:[function(require,module,exports){
'use strict';

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

},{}],71:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = Function.prototype.bind || implementation;

},{"./implementation":70}],72:[function(require,module,exports){
'use strict';

var undefined;

var $SyntaxError = SyntaxError;
var $Function = Function;
var $TypeError = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
	try {
		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () {
	throw new $TypeError();
};
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols = require('has-symbols')();

var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

var needsEval = {};

var TypedArray = typeof Uint8Array === 'undefined' ? undefined : getProto(Uint8Array);

var INTRINSICS = {
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols ? getProto([][Symbol.iterator]()) : undefined,
	'%AsyncFromSyncIteratorPrototype%': undefined,
	'%AsyncFunction%': needsEval,
	'%AsyncGenerator%': needsEval,
	'%AsyncGeneratorFunction%': needsEval,
	'%AsyncIteratorPrototype%': needsEval,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined : BigInt,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined : FinalizationRegistry,
	'%Function%': $Function,
	'%GeneratorFunction%': needsEval,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols ? getProto(getProto([][Symbol.iterator]())) : undefined,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined,
	'%Map%': typeof Map === 'undefined' ? undefined : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols ? undefined : getProto(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined : Proxy,
	'%RangeError%': RangeError,
	'%ReferenceError%': ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols ? undefined : getProto(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols ? getProto(''[Symbol.iterator]()) : undefined,
	'%Symbol%': hasSymbols ? Symbol : undefined,
	'%SyntaxError%': $SyntaxError,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypeError%': $TypeError,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array,
	'%URIError%': URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined : WeakSet
};

var doEval = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen) {
			value = getProto(gen.prototype);
		}
	}

	INTRINSICS[name] = value;

	return value;
};

var LEGACY_ALIASES = {
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind = require('function-bind');
var hasOwn = require('has');
var $concat = bind.call(Function.call, Array.prototype.concat);
var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
var $replace = bind.call(Function.call, String.prototype.replace);
var $strSlice = bind.call(Function.call, String.prototype.slice);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var first = $strSlice(string, 0, 1);
	var last = $strSlice(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
		alias = LEGACY_ALIASES[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn(INTRINSICS, intrinsicName)) {
		var value = INTRINSICS[intrinsicName];
		if (value === needsEval) {
			value = doEval(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
};

module.exports = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError('"allowMissing" argument must be a boolean');
	}

	var parts = stringToPath(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply(parts, $concat([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice(part, 0, 1);
		var last = $strSlice(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn(INTRINSICS, intrinsicRealName)) {
			value = INTRINSICS[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined;
			}
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS[intrinsicRealName] = value;
			}
		}
	}
	return value;
};

},{"function-bind":71,"has":75,"has-symbols":73}],73:[function(require,module,exports){
(function (global){(function (){
'use strict';

var origSymbol = global.Symbol;
var hasSymbolSham = require('./shams');

module.exports = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./shams":74}],74:[function(require,module,exports){
'use strict';

/* eslint complexity: [2, 18], max-statements: [2, 33] */
module.exports = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};

},{}],75:[function(require,module,exports){
'use strict';

var bind = require('function-bind');

module.exports = bind.call(Function.call, Object.prototype.hasOwnProperty);

},{"function-bind":71}],76:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],77:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}

},{}],78:[function(require,module,exports){
'use strict';

var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
var callBound = require('call-bind/callBound');

var $toString = callBound('Object.prototype.toString');

var isStandardArguments = function isArguments(value) {
	if (hasToStringTag && value && typeof value === 'object' && Symbol.toStringTag in value) {
		return false;
	}
	return $toString(value) === '[object Arguments]';
};

var isLegacyArguments = function isArguments(value) {
	if (isStandardArguments(value)) {
		return true;
	}
	return value !== null &&
		typeof value === 'object' &&
		typeof value.length === 'number' &&
		value.length >= 0 &&
		$toString(value) !== '[object Array]' &&
		$toString(value.callee) === '[object Function]';
};

var supportsStandardArguments = (function () {
	return isStandardArguments(arguments);
}());

isStandardArguments.isLegacyArguments = isLegacyArguments; // for tests

module.exports = supportsStandardArguments ? isStandardArguments : isLegacyArguments;

},{"call-bind/callBound":66}],79:[function(require,module,exports){
'use strict';

var toStr = Object.prototype.toString;
var fnToStr = Function.prototype.toString;
var isFnRegex = /^\s*(?:function)?\*/;
var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
var getProto = Object.getPrototypeOf;
var getGeneratorFunc = function () { // eslint-disable-line consistent-return
	if (!hasToStringTag) {
		return false;
	}
	try {
		return Function('return function*() {}')();
	} catch (e) {
	}
};
var generatorFunc = getGeneratorFunc();
var GeneratorFunction = getProto && generatorFunc ? getProto(generatorFunc) : false;

module.exports = function isGeneratorFunction(fn) {
	if (typeof fn !== 'function') {
		return false;
	}
	if (isFnRegex.test(fnToStr.call(fn))) {
		return true;
	}
	if (!hasToStringTag) {
		var str = toStr.call(fn);
		return str === '[object GeneratorFunction]';
	}
	return getProto && getProto(fn) === GeneratorFunction;
};

},{}],80:[function(require,module,exports){
(function (global){(function (){
'use strict';

var forEach = require('foreach');
var availableTypedArrays = require('available-typed-arrays');
var callBound = require('call-bind/callBound');

var $toString = callBound('Object.prototype.toString');
var hasSymbols = require('has-symbols')();
var hasToStringTag = hasSymbols && typeof Symbol.toStringTag === 'symbol';

var typedArrays = availableTypedArrays();

var $indexOf = callBound('Array.prototype.indexOf', true) || function indexOf(array, value) {
	for (var i = 0; i < array.length; i += 1) {
		if (array[i] === value) {
			return i;
		}
	}
	return -1;
};
var $slice = callBound('String.prototype.slice');
var toStrTags = {};
var gOPD = require('es-abstract/helpers/getOwnPropertyDescriptor');
var getPrototypeOf = Object.getPrototypeOf; // require('getprototypeof');
if (hasToStringTag && gOPD && getPrototypeOf) {
	forEach(typedArrays, function (typedArray) {
		var arr = new global[typedArray]();
		if (!(Symbol.toStringTag in arr)) {
			throw new EvalError('this engine has support for Symbol.toStringTag, but ' + typedArray + ' does not have the property! Please report this.');
		}
		var proto = getPrototypeOf(arr);
		var descriptor = gOPD(proto, Symbol.toStringTag);
		if (!descriptor) {
			var superProto = getPrototypeOf(proto);
			descriptor = gOPD(superProto, Symbol.toStringTag);
		}
		toStrTags[typedArray] = descriptor.get;
	});
}

var tryTypedArrays = function tryAllTypedArrays(value) {
	var anyTrue = false;
	forEach(toStrTags, function (getter, typedArray) {
		if (!anyTrue) {
			try {
				anyTrue = getter.call(value) === typedArray;
			} catch (e) { /**/ }
		}
	});
	return anyTrue;
};

module.exports = function isTypedArray(value) {
	if (!value || typeof value !== 'object') { return false; }
	if (!hasToStringTag) {
		var tag = $slice($toString(value), 8, -1);
		return $indexOf(typedArrays, tag) > -1;
	}
	if (!gOPD) { return false; }
	return tryTypedArrays(value);
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"available-typed-arrays":63,"call-bind/callBound":66,"es-abstract/helpers/getOwnPropertyDescriptor":68,"foreach":69,"has-symbols":73}],81:[function(require,module,exports){
(function (process){(function (){
// 'path' module extracted from Node.js v8.11.1 (only the posix part)
// transplited with Babel

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

function assertPath(path) {
  if (typeof path !== 'string') {
    throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
  }
}

// Resolves . and .. elements in a path with directory names
function normalizeStringPosix(path, allowAboveRoot) {
  var res = '';
  var lastSegmentLength = 0;
  var lastSlash = -1;
  var dots = 0;
  var code;
  for (var i = 0; i <= path.length; ++i) {
    if (i < path.length)
      code = path.charCodeAt(i);
    else if (code === 47 /*/*/)
      break;
    else
      code = 47 /*/*/;
    if (code === 47 /*/*/) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /*.*/ || res.charCodeAt(res.length - 2) !== 46 /*.*/) {
          if (res.length > 2) {
            var lastSlashIndex = res.lastIndexOf('/');
            if (lastSlashIndex !== res.length - 1) {
              if (lastSlashIndex === -1) {
                res = '';
                lastSegmentLength = 0;
              } else {
                res = res.slice(0, lastSlashIndex);
                lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
              }
              lastSlash = i;
              dots = 0;
              continue;
            }
          } else if (res.length === 2 || res.length === 1) {
            res = '';
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0)
            res += '/..';
          else
            res = '..';
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0)
          res += '/' + path.slice(lastSlash + 1, i);
        else
          res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === 46 /*.*/ && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}

function _format(sep, pathObject) {
  var dir = pathObject.dir || pathObject.root;
  var base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');
  if (!dir) {
    return base;
  }
  if (dir === pathObject.root) {
    return dir + base;
  }
  return dir + sep + base;
}

var posix = {
  // path.resolve([from ...], to)
  resolve: function resolve() {
    var resolvedPath = '';
    var resolvedAbsolute = false;
    var cwd;

    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path;
      if (i >= 0)
        path = arguments[i];
      else {
        if (cwd === undefined)
          cwd = process.cwd();
        path = cwd;
      }

      assertPath(path);

      // Skip empty entries
      if (path.length === 0) {
        continue;
      }

      resolvedPath = path + '/' + resolvedPath;
      resolvedAbsolute = path.charCodeAt(0) === 47 /*/*/;
    }

    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)

    // Normalize the path
    resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);

    if (resolvedAbsolute) {
      if (resolvedPath.length > 0)
        return '/' + resolvedPath;
      else
        return '/';
    } else if (resolvedPath.length > 0) {
      return resolvedPath;
    } else {
      return '.';
    }
  },

  normalize: function normalize(path) {
    assertPath(path);

    if (path.length === 0) return '.';

    var isAbsolute = path.charCodeAt(0) === 47 /*/*/;
    var trailingSeparator = path.charCodeAt(path.length - 1) === 47 /*/*/;

    // Normalize the path
    path = normalizeStringPosix(path, !isAbsolute);

    if (path.length === 0 && !isAbsolute) path = '.';
    if (path.length > 0 && trailingSeparator) path += '/';

    if (isAbsolute) return '/' + path;
    return path;
  },

  isAbsolute: function isAbsolute(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === 47 /*/*/;
  },

  join: function join() {
    if (arguments.length === 0)
      return '.';
    var joined;
    for (var i = 0; i < arguments.length; ++i) {
      var arg = arguments[i];
      assertPath(arg);
      if (arg.length > 0) {
        if (joined === undefined)
          joined = arg;
        else
          joined += '/' + arg;
      }
    }
    if (joined === undefined)
      return '.';
    return posix.normalize(joined);
  },

  relative: function relative(from, to) {
    assertPath(from);
    assertPath(to);

    if (from === to) return '';

    from = posix.resolve(from);
    to = posix.resolve(to);

    if (from === to) return '';

    // Trim any leading backslashes
    var fromStart = 1;
    for (; fromStart < from.length; ++fromStart) {
      if (from.charCodeAt(fromStart) !== 47 /*/*/)
        break;
    }
    var fromEnd = from.length;
    var fromLen = fromEnd - fromStart;

    // Trim any leading backslashes
    var toStart = 1;
    for (; toStart < to.length; ++toStart) {
      if (to.charCodeAt(toStart) !== 47 /*/*/)
        break;
    }
    var toEnd = to.length;
    var toLen = toEnd - toStart;

    // Compare paths to find the longest common path from root
    var length = fromLen < toLen ? fromLen : toLen;
    var lastCommonSep = -1;
    var i = 0;
    for (; i <= length; ++i) {
      if (i === length) {
        if (toLen > length) {
          if (to.charCodeAt(toStart + i) === 47 /*/*/) {
            // We get here if `from` is the exact base path for `to`.
            // For example: from='/foo/bar'; to='/foo/bar/baz'
            return to.slice(toStart + i + 1);
          } else if (i === 0) {
            // We get here if `from` is the root
            // For example: from='/'; to='/foo'
            return to.slice(toStart + i);
          }
        } else if (fromLen > length) {
          if (from.charCodeAt(fromStart + i) === 47 /*/*/) {
            // We get here if `to` is the exact base path for `from`.
            // For example: from='/foo/bar/baz'; to='/foo/bar'
            lastCommonSep = i;
          } else if (i === 0) {
            // We get here if `to` is the root.
            // For example: from='/foo'; to='/'
            lastCommonSep = 0;
          }
        }
        break;
      }
      var fromCode = from.charCodeAt(fromStart + i);
      var toCode = to.charCodeAt(toStart + i);
      if (fromCode !== toCode)
        break;
      else if (fromCode === 47 /*/*/)
        lastCommonSep = i;
    }

    var out = '';
    // Generate the relative path based on the path difference between `to`
    // and `from`
    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
      if (i === fromEnd || from.charCodeAt(i) === 47 /*/*/) {
        if (out.length === 0)
          out += '..';
        else
          out += '/..';
      }
    }

    // Lastly, append the rest of the destination (`to`) path that comes after
    // the common path parts
    if (out.length > 0)
      return out + to.slice(toStart + lastCommonSep);
    else {
      toStart += lastCommonSep;
      if (to.charCodeAt(toStart) === 47 /*/*/)
        ++toStart;
      return to.slice(toStart);
    }
  },

  _makeLong: function _makeLong(path) {
    return path;
  },

  dirname: function dirname(path) {
    assertPath(path);
    if (path.length === 0) return '.';
    var code = path.charCodeAt(0);
    var hasRoot = code === 47 /*/*/;
    var end = -1;
    var matchedSlash = true;
    for (var i = path.length - 1; i >= 1; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          if (!matchedSlash) {
            end = i;
            break;
          }
        } else {
        // We saw the first non-path separator
        matchedSlash = false;
      }
    }

    if (end === -1) return hasRoot ? '/' : '.';
    if (hasRoot && end === 1) return '//';
    return path.slice(0, end);
  },

  basename: function basename(path, ext) {
    if (ext !== undefined && typeof ext !== 'string') throw new TypeError('"ext" argument must be a string');
    assertPath(path);

    var start = 0;
    var end = -1;
    var matchedSlash = true;
    var i;

    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
      if (ext.length === path.length && ext === path) return '';
      var extIdx = ext.length - 1;
      var firstNonSlashEnd = -1;
      for (i = path.length - 1; i >= 0; --i) {
        var code = path.charCodeAt(i);
        if (code === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else {
          if (firstNonSlashEnd === -1) {
            // We saw the first non-path separator, remember this index in case
            // we need it if the extension ends up not matching
            matchedSlash = false;
            firstNonSlashEnd = i + 1;
          }
          if (extIdx >= 0) {
            // Try to match the explicit extension
            if (code === ext.charCodeAt(extIdx)) {
              if (--extIdx === -1) {
                // We matched the extension, so mark this as the end of our path
                // component
                end = i;
              }
            } else {
              // Extension does not match, so our result is the entire path
              // component
              extIdx = -1;
              end = firstNonSlashEnd;
            }
          }
        }
      }

      if (start === end) end = firstNonSlashEnd;else if (end === -1) end = path.length;
      return path.slice(start, end);
    } else {
      for (i = path.length - 1; i >= 0; --i) {
        if (path.charCodeAt(i) === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else if (end === -1) {
          // We saw the first non-path separator, mark this as the end of our
          // path component
          matchedSlash = false;
          end = i + 1;
        }
      }

      if (end === -1) return '';
      return path.slice(start, end);
    }
  },

  extname: function extname(path) {
    assertPath(path);
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;
    for (var i = path.length - 1; i >= 0; --i) {
      var code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1)
            startDot = i;
          else if (preDotState !== 1)
            preDotState = 1;
      } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
        // We saw a non-dot character immediately before the dot
        preDotState === 0 ||
        // The (right-most) trimmed path component is exactly '..'
        preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      return '';
    }
    return path.slice(startDot, end);
  },

  format: function format(pathObject) {
    if (pathObject === null || typeof pathObject !== 'object') {
      throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
    }
    return _format('/', pathObject);
  },

  parse: function parse(path) {
    assertPath(path);

    var ret = { root: '', dir: '', base: '', ext: '', name: '' };
    if (path.length === 0) return ret;
    var code = path.charCodeAt(0);
    var isAbsolute = code === 47 /*/*/;
    var start;
    if (isAbsolute) {
      ret.root = '/';
      start = 1;
    } else {
      start = 0;
    }
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    var i = path.length - 1;

    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;

    // Get non-dir info
    for (; i >= start; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1) startDot = i;else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
    // We saw a non-dot character immediately before the dot
    preDotState === 0 ||
    // The (right-most) trimmed path component is exactly '..'
    preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      if (end !== -1) {
        if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end);else ret.base = ret.name = path.slice(startPart, end);
      }
    } else {
      if (startPart === 0 && isAbsolute) {
        ret.name = path.slice(1, startDot);
        ret.base = path.slice(1, end);
      } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
      }
      ret.ext = path.slice(startDot, end);
    }

    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);else if (isAbsolute) ret.dir = '/';

    return ret;
  },

  sep: '/',
  delimiter: ':',
  win32: null,
  posix: null
};

posix.posix = posix;

module.exports = posix;

}).call(this)}).call(this,require('_process'))
},{"_process":82}],82:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],83:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],84:[function(require,module,exports){
// Currently in sync with Node.js lib/internal/util/types.js
// https://github.com/nodejs/node/commit/112cc7c27551254aa2b17098fb774867f05ed0d9

'use strict';

var isArgumentsObject = require('is-arguments');
var isGeneratorFunction = require('is-generator-function');
var whichTypedArray = require('which-typed-array');
var isTypedArray = require('is-typed-array');

function uncurryThis(f) {
  return f.call.bind(f);
}

var BigIntSupported = typeof BigInt !== 'undefined';
var SymbolSupported = typeof Symbol !== 'undefined';

var ObjectToString = uncurryThis(Object.prototype.toString);

var numberValue = uncurryThis(Number.prototype.valueOf);
var stringValue = uncurryThis(String.prototype.valueOf);
var booleanValue = uncurryThis(Boolean.prototype.valueOf);

if (BigIntSupported) {
  var bigIntValue = uncurryThis(BigInt.prototype.valueOf);
}

if (SymbolSupported) {
  var symbolValue = uncurryThis(Symbol.prototype.valueOf);
}

function checkBoxedPrimitive(value, prototypeValueOf) {
  if (typeof value !== 'object') {
    return false;
  }
  try {
    prototypeValueOf(value);
    return true;
  } catch(e) {
    return false;
  }
}

exports.isArgumentsObject = isArgumentsObject;
exports.isGeneratorFunction = isGeneratorFunction;
exports.isTypedArray = isTypedArray;

// Taken from here and modified for better browser support
// https://github.com/sindresorhus/p-is-promise/blob/cda35a513bda03f977ad5cde3a079d237e82d7ef/index.js
function isPromise(input) {
	return (
		(
			typeof Promise !== 'undefined' &&
			input instanceof Promise
		) ||
		(
			input !== null &&
			typeof input === 'object' &&
			typeof input.then === 'function' &&
			typeof input.catch === 'function'
		)
	);
}
exports.isPromise = isPromise;

function isArrayBufferView(value) {
  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView) {
    return ArrayBuffer.isView(value);
  }

  return (
    isTypedArray(value) ||
    isDataView(value)
  );
}
exports.isArrayBufferView = isArrayBufferView;


function isUint8Array(value) {
  return whichTypedArray(value) === 'Uint8Array';
}
exports.isUint8Array = isUint8Array;

function isUint8ClampedArray(value) {
  return whichTypedArray(value) === 'Uint8ClampedArray';
}
exports.isUint8ClampedArray = isUint8ClampedArray;

function isUint16Array(value) {
  return whichTypedArray(value) === 'Uint16Array';
}
exports.isUint16Array = isUint16Array;

function isUint32Array(value) {
  return whichTypedArray(value) === 'Uint32Array';
}
exports.isUint32Array = isUint32Array;

function isInt8Array(value) {
  return whichTypedArray(value) === 'Int8Array';
}
exports.isInt8Array = isInt8Array;

function isInt16Array(value) {
  return whichTypedArray(value) === 'Int16Array';
}
exports.isInt16Array = isInt16Array;

function isInt32Array(value) {
  return whichTypedArray(value) === 'Int32Array';
}
exports.isInt32Array = isInt32Array;

function isFloat32Array(value) {
  return whichTypedArray(value) === 'Float32Array';
}
exports.isFloat32Array = isFloat32Array;

function isFloat64Array(value) {
  return whichTypedArray(value) === 'Float64Array';
}
exports.isFloat64Array = isFloat64Array;

function isBigInt64Array(value) {
  return whichTypedArray(value) === 'BigInt64Array';
}
exports.isBigInt64Array = isBigInt64Array;

function isBigUint64Array(value) {
  return whichTypedArray(value) === 'BigUint64Array';
}
exports.isBigUint64Array = isBigUint64Array;

function isMapToString(value) {
  return ObjectToString(value) === '[object Map]';
}
isMapToString.working = (
  typeof Map !== 'undefined' &&
  isMapToString(new Map())
);

function isMap(value) {
  if (typeof Map === 'undefined') {
    return false;
  }

  return isMapToString.working
    ? isMapToString(value)
    : value instanceof Map;
}
exports.isMap = isMap;

function isSetToString(value) {
  return ObjectToString(value) === '[object Set]';
}
isSetToString.working = (
  typeof Set !== 'undefined' &&
  isSetToString(new Set())
);
function isSet(value) {
  if (typeof Set === 'undefined') {
    return false;
  }

  return isSetToString.working
    ? isSetToString(value)
    : value instanceof Set;
}
exports.isSet = isSet;

function isWeakMapToString(value) {
  return ObjectToString(value) === '[object WeakMap]';
}
isWeakMapToString.working = (
  typeof WeakMap !== 'undefined' &&
  isWeakMapToString(new WeakMap())
);
function isWeakMap(value) {
  if (typeof WeakMap === 'undefined') {
    return false;
  }

  return isWeakMapToString.working
    ? isWeakMapToString(value)
    : value instanceof WeakMap;
}
exports.isWeakMap = isWeakMap;

function isWeakSetToString(value) {
  return ObjectToString(value) === '[object WeakSet]';
}
isWeakSetToString.working = (
  typeof WeakSet !== 'undefined' &&
  isWeakSetToString(new WeakSet())
);
function isWeakSet(value) {
  return isWeakSetToString(value);
}
exports.isWeakSet = isWeakSet;

function isArrayBufferToString(value) {
  return ObjectToString(value) === '[object ArrayBuffer]';
}
isArrayBufferToString.working = (
  typeof ArrayBuffer !== 'undefined' &&
  isArrayBufferToString(new ArrayBuffer())
);
function isArrayBuffer(value) {
  if (typeof ArrayBuffer === 'undefined') {
    return false;
  }

  return isArrayBufferToString.working
    ? isArrayBufferToString(value)
    : value instanceof ArrayBuffer;
}
exports.isArrayBuffer = isArrayBuffer;

function isDataViewToString(value) {
  return ObjectToString(value) === '[object DataView]';
}
isDataViewToString.working = (
  typeof ArrayBuffer !== 'undefined' &&
  typeof DataView !== 'undefined' &&
  isDataViewToString(new DataView(new ArrayBuffer(1), 0, 1))
);
function isDataView(value) {
  if (typeof DataView === 'undefined') {
    return false;
  }

  return isDataViewToString.working
    ? isDataViewToString(value)
    : value instanceof DataView;
}
exports.isDataView = isDataView;

function isSharedArrayBufferToString(value) {
  return ObjectToString(value) === '[object SharedArrayBuffer]';
}
isSharedArrayBufferToString.working = (
  typeof SharedArrayBuffer !== 'undefined' &&
  isSharedArrayBufferToString(new SharedArrayBuffer())
);
function isSharedArrayBuffer(value) {
  if (typeof SharedArrayBuffer === 'undefined') {
    return false;
  }

  return isSharedArrayBufferToString.working
    ? isSharedArrayBufferToString(value)
    : value instanceof SharedArrayBuffer;
}
exports.isSharedArrayBuffer = isSharedArrayBuffer;

function isAsyncFunction(value) {
  return ObjectToString(value) === '[object AsyncFunction]';
}
exports.isAsyncFunction = isAsyncFunction;

function isMapIterator(value) {
  return ObjectToString(value) === '[object Map Iterator]';
}
exports.isMapIterator = isMapIterator;

function isSetIterator(value) {
  return ObjectToString(value) === '[object Set Iterator]';
}
exports.isSetIterator = isSetIterator;

function isGeneratorObject(value) {
  return ObjectToString(value) === '[object Generator]';
}
exports.isGeneratorObject = isGeneratorObject;

function isWebAssemblyCompiledModule(value) {
  return ObjectToString(value) === '[object WebAssembly.Module]';
}
exports.isWebAssemblyCompiledModule = isWebAssemblyCompiledModule;

function isNumberObject(value) {
  return checkBoxedPrimitive(value, numberValue);
}
exports.isNumberObject = isNumberObject;

function isStringObject(value) {
  return checkBoxedPrimitive(value, stringValue);
}
exports.isStringObject = isStringObject;

function isBooleanObject(value) {
  return checkBoxedPrimitive(value, booleanValue);
}
exports.isBooleanObject = isBooleanObject;

function isBigIntObject(value) {
  return BigIntSupported && checkBoxedPrimitive(value, bigIntValue);
}
exports.isBigIntObject = isBigIntObject;

function isSymbolObject(value) {
  return SymbolSupported && checkBoxedPrimitive(value, symbolValue);
}
exports.isSymbolObject = isSymbolObject;

function isBoxedPrimitive(value) {
  return (
    isNumberObject(value) ||
    isStringObject(value) ||
    isBooleanObject(value) ||
    isBigIntObject(value) ||
    isSymbolObject(value)
  );
}
exports.isBoxedPrimitive = isBoxedPrimitive;

function isAnyArrayBuffer(value) {
  return typeof Uint8Array !== 'undefined' && (
    isArrayBuffer(value) ||
    isSharedArrayBuffer(value)
  );
}
exports.isAnyArrayBuffer = isAnyArrayBuffer;

['isProxy', 'isExternal', 'isModuleNamespaceObject'].forEach(function(method) {
  Object.defineProperty(exports, method, {
    enumerable: false,
    value: function() {
      throw new Error(method + ' is not supported in userland');
    }
  });
});

},{"is-arguments":78,"is-generator-function":79,"is-typed-array":80,"which-typed-array":86}],85:[function(require,module,exports){
(function (process){(function (){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors ||
  function getOwnPropertyDescriptors(obj) {
    var keys = Object.keys(obj);
    var descriptors = {};
    for (var i = 0; i < keys.length; i++) {
      descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
    }
    return descriptors;
  };

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  if (typeof process !== 'undefined' && process.noDeprecation === true) {
    return fn;
  }

  // Allow for deprecating things in the process of starting up.
  if (typeof process === 'undefined') {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnvRegex = /^$/;

if (process.env.NODE_DEBUG) {
  var debugEnv = process.env.NODE_DEBUG;
  debugEnv = debugEnv.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/,/g, '$|^')
    .toUpperCase();
  debugEnvRegex = new RegExp('^' + debugEnv + '$', 'i');
}
exports.debuglog = function(set) {
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (debugEnvRegex.test(set)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
exports.types = require('./support/types');

function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;
exports.types.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;
exports.types.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;
exports.types.isNativeError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

var kCustomPromisifiedSymbol = typeof Symbol !== 'undefined' ? Symbol('util.promisify.custom') : undefined;

exports.promisify = function promisify(original) {
  if (typeof original !== 'function')
    throw new TypeError('The "original" argument must be of type Function');

  if (kCustomPromisifiedSymbol && original[kCustomPromisifiedSymbol]) {
    var fn = original[kCustomPromisifiedSymbol];
    if (typeof fn !== 'function') {
      throw new TypeError('The "util.promisify.custom" argument must be of type Function');
    }
    Object.defineProperty(fn, kCustomPromisifiedSymbol, {
      value: fn, enumerable: false, writable: false, configurable: true
    });
    return fn;
  }

  function fn() {
    var promiseResolve, promiseReject;
    var promise = new Promise(function (resolve, reject) {
      promiseResolve = resolve;
      promiseReject = reject;
    });

    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    args.push(function (err, value) {
      if (err) {
        promiseReject(err);
      } else {
        promiseResolve(value);
      }
    });

    try {
      original.apply(this, args);
    } catch (err) {
      promiseReject(err);
    }

    return promise;
  }

  Object.setPrototypeOf(fn, Object.getPrototypeOf(original));

  if (kCustomPromisifiedSymbol) Object.defineProperty(fn, kCustomPromisifiedSymbol, {
    value: fn, enumerable: false, writable: false, configurable: true
  });
  return Object.defineProperties(
    fn,
    getOwnPropertyDescriptors(original)
  );
}

exports.promisify.custom = kCustomPromisifiedSymbol

function callbackifyOnRejected(reason, cb) {
  // `!reason` guard inspired by bluebird (Ref: https://goo.gl/t5IS6M).
  // Because `null` is a special error value in callbacks which means "no error
  // occurred", we error-wrap so the callback consumer can distinguish between
  // "the promise rejected with null" or "the promise fulfilled with undefined".
  if (!reason) {
    var newReason = new Error('Promise was rejected with a falsy value');
    newReason.reason = reason;
    reason = newReason;
  }
  return cb(reason);
}

function callbackify(original) {
  if (typeof original !== 'function') {
    throw new TypeError('The "original" argument must be of type Function');
  }

  // We DO NOT return the promise as it gives the user a false sense that
  // the promise is actually somehow related to the callback's execution
  // and that the callback throwing will reject the promise.
  function callbackified() {
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }

    var maybeCb = args.pop();
    if (typeof maybeCb !== 'function') {
      throw new TypeError('The last argument must be of type Function');
    }
    var self = this;
    var cb = function() {
      return maybeCb.apply(self, arguments);
    };
    // In true node style we process the callback on `nextTick` with all the
    // implications (stack, `uncaughtException`, `async_hooks`)
    original.apply(this, args)
      .then(function(ret) { process.nextTick(cb.bind(null, null, ret)) },
            function(rej) { process.nextTick(callbackifyOnRejected.bind(null, rej, cb)) });
  }

  Object.setPrototypeOf(callbackified, Object.getPrototypeOf(original));
  Object.defineProperties(callbackified,
                          getOwnPropertyDescriptors(original));
  return callbackified;
}
exports.callbackify = callbackify;

}).call(this)}).call(this,require('_process'))
},{"./support/isBuffer":83,"./support/types":84,"_process":82,"inherits":77}],86:[function(require,module,exports){
(function (global){(function (){
'use strict';

var forEach = require('foreach');
var availableTypedArrays = require('available-typed-arrays');
var callBound = require('call-bind/callBound');

var $toString = callBound('Object.prototype.toString');
var hasSymbols = require('has-symbols')();
var hasToStringTag = hasSymbols && typeof Symbol.toStringTag === 'symbol';

var typedArrays = availableTypedArrays();

var $slice = callBound('String.prototype.slice');
var toStrTags = {};
var gOPD = require('es-abstract/helpers/getOwnPropertyDescriptor');
var getPrototypeOf = Object.getPrototypeOf; // require('getprototypeof');
if (hasToStringTag && gOPD && getPrototypeOf) {
	forEach(typedArrays, function (typedArray) {
		if (typeof global[typedArray] === 'function') {
			var arr = new global[typedArray]();
			if (!(Symbol.toStringTag in arr)) {
				throw new EvalError('this engine has support for Symbol.toStringTag, but ' + typedArray + ' does not have the property! Please report this.');
			}
			var proto = getPrototypeOf(arr);
			var descriptor = gOPD(proto, Symbol.toStringTag);
			if (!descriptor) {
				var superProto = getPrototypeOf(proto);
				descriptor = gOPD(superProto, Symbol.toStringTag);
			}
			toStrTags[typedArray] = descriptor.get;
		}
	});
}

var tryTypedArrays = function tryAllTypedArrays(value) {
	var foundName = false;
	forEach(toStrTags, function (getter, typedArray) {
		if (!foundName) {
			try {
				var name = getter.call(value);
				if (name === typedArray) {
					foundName = name;
				}
			} catch (e) {}
		}
	});
	return foundName;
};

var isTypedArray = require('is-typed-array');

module.exports = function whichTypedArray(value) {
	if (!isTypedArray(value)) { return false; }
	if (!hasToStringTag) { return $slice($toString(value), 8, -1); }
	return tryTypedArrays(value);
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"available-typed-arrays":63,"call-bind/callBound":66,"es-abstract/helpers/getOwnPropertyDescriptor":68,"foreach":69,"has-symbols":73,"is-typed-array":80}]},{},[24])(24)
});
