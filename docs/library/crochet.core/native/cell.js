"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (ffi) => {
    ffi.defun("cell.make", (v) => ffi.cell(v));
    ffi.defun("cell.deref", (x) => ffi.deref_cell(x));
    ffi.defun("cell.cas", (x, o, n) => ffi.boolean(ffi.update_cell(x, o, n)));
};
