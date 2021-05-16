"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (ffi) => {
    ffi.defun("etc.panic", (tag, message) => {
        throw ffi.panic(ffi.text_to_string(tag), ffi.text_to_string(message));
    });
    ffi.defun("debug.any-to-text", (x) => {
        return ffi.text(ffi.to_debug_string(x));
    });
    ffi.defun("debug.type-name", (x) => {
        return ffi.text(ffi.type_name(x));
    });
    ffi.defun("debug.text-length", (x) => {
        return ffi.integer(BigInt(ffi.text_to_string(x).length));
    });
    ffi.defun("thunk.is-forced", (x) => ffi.boolean(ffi.is_thunk_forced(x)));
};
