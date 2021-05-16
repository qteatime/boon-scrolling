"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (ffi) => {
    ffi.defun("conversion.tuple-to-interpolation", (xs) => {
        return ffi.interpolation(ffi.tuple_to_array(xs));
    });
};
