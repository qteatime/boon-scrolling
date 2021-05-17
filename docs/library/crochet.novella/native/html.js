"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (ffi) => {
    const known_tags = ["h1", "h2", "p", "header", "section", "strong", "em"];
    //#region Selections
    const references = new WeakMap();
    const refered_elements = new WeakMap();
    function make_id() {
        const id = new Uint8Array(16);
        crypto.getRandomValues(id);
        return Array.from(id)
            .map((x) => x.toString(16).padStart(2, "0"))
            .join("");
    }
    function get_reference(value) {
        const ref = references.get(value);
        if (ref != null) {
            return ref;
        }
        else {
            const id = make_id();
            references.set(value, id);
            return id;
        }
    }
    function set_reference(ref, element, value) {
        element.setAttribute("data-reference", get_reference(ref));
        const elements = refered_elements.get(ref) ?? [];
        elements.push({ value, element });
        refered_elements.set(ref, elements);
    }
    function defer() {
        const result = {
            promise: null,
            resolve: null,
            reject: null,
        };
        result.promise = new Promise((resolve, reject) => {
            result.resolve = resolve;
            result.reject = reject;
        });
        return result;
    }
    function sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(), ms);
        });
    }
    function role_to_tag(x) {
        if (known_tags.includes(x)) {
            return x;
        }
        else {
            return "span";
        }
    }
    //#region Measuring
    class Rect {
        constructor(left, top, width, height) {
            this.left = left;
            this.top = top;
            this.width = width;
            this.height = height;
        }
        static from_element_offset(x) {
            return new Rect(x.offsetLeft, x.offsetTop, x.offsetWidth, x.offsetHeight);
        }
        get bottom() {
            return this.top + this.height;
        }
        get right() {
            return this.left + this.width;
        }
    }
    function measure(canvas, x) {
        const old_visibility = x.style.visibility;
        const old_animation = x.style.animation;
        x.style.visibility = "hidden";
        x.style.animation = "none";
        canvas.root.appendChild(x);
        const dimensions = Rect.from_element_offset(x);
        canvas.root.removeChild(x);
        x.style.animation = old_animation;
        x.style.visibility = old_visibility;
        return dimensions;
    }
    function scroll_to(container, element, time) {
        const deferred = defer();
        const st = container.scrollTop;
        const ot = element.offsetTop;
        const diff = ot - st;
        let start = null;
        const style = container.style;
        const old_scroll_snap = style.scrollSnapType;
        style.scrollSnapType = "none";
        function step(ts) {
            if (start == null) {
                start = ts;
            }
            const elapsed = ts - start;
            const done = elapsed / time;
            const scroll = Math.min(ot, st + diff * done);
            container.scrollTop = scroll;
            if (done < 1) {
                requestAnimationFrame(step);
            }
            else {
                style.scrollSnapType = old_scroll_snap;
                deferred.resolve();
            }
        }
        requestAnimationFrame(step);
        return deferred.promise;
    }
    //#region Rendering
    let PageStatus;
    (function (PageStatus) {
        PageStatus[PageStatus["NEW_PAGE"] = 0] = "NEW_PAGE";
        PageStatus[PageStatus["PAGE_RENDERING"] = 1] = "PAGE_RENDERING";
        PageStatus[PageStatus["OLD_PAGE"] = 2] = "OLD_PAGE";
    })(PageStatus || (PageStatus = {}));
    class Canvas {
        constructor(root) {
            this.root = root;
            this.mark = null;
            this.new_page = PageStatus.NEW_PAGE;
        }
    }
    function is_interactive(x) {
        if (x.getAttribute("data-interactive") === "true") {
            return true;
        }
        for (const child of x.children) {
            if (child instanceof HTMLElement && is_interactive(child)) {
                return true;
            }
        }
        return false;
    }
    async function click_to_continue(canvas, mark) {
        const deferred = defer();
        canvas.root.setAttribute("data-wait", "true");
        canvas.root.addEventListener("click", (ev) => {
            ev.stopPropagation();
            ev.preventDefault();
            canvas.root.removeAttribute("data-wait");
            if (mark != null) {
                canvas.mark = mark;
            }
            else {
                const children = canvas.root.children;
                canvas.mark =
                    children.item(children.length - 1) ?? null;
            }
            deferred.resolve();
        }, { once: true });
        return deferred.promise;
    }
    async function wait_mark(canvas, mark) {
        if (canvas.mark == null) {
            canvas.mark = mark;
            return;
        }
        const dimensions = measure(canvas, mark);
        if (dimensions.bottom - mark.offsetTop > canvas.root.clientHeight) {
            await click_to_continue(canvas, mark);
        }
        if (is_interactive(mark)) {
            canvas.mark = null;
        }
    }
    async function animate(x, frames, time) {
        const deferred = defer();
        const animation = x.animate(frames, time);
        animation.addEventListener("finish", () => deferred.resolve());
        animation.addEventListener("cancel", () => deferred.resolve());
        await deferred.promise;
    }
    async function animate_appear(x, time) {
        x.style.opacity = "0";
        x.style.top = "-1em";
        x.style.position = "relative";
        const appear = [
            { opacity: 0, top: "-1em" },
            { opacity: 1, top: "0px" },
        ];
        await animate(x, appear, time);
        x.style.opacity = "1";
        x.style.top = "0px";
        x.style.position = "relative";
    }
    function get_canvas(x0) {
        const x = ffi.unbox(x0);
        if (x instanceof Canvas) {
            return x;
        }
        else {
            throw ffi.panic("invalid-type", `Expected a canvas`);
        }
    }
    //#region Foreign functions
    ffi.defun("html.empty", () => {
        const element = document.createElement("span");
        element.className = "novella-element novella-empty";
        return ffi.box(element);
    });
    ffi.defun("html.element", (attrs0, children0) => {
        const attrs = ffi.record_to_map(attrs0);
        const children = ffi.tuple_to_array(children0);
        const element = document.createElement("span");
        for (const [k, v] of attrs.entries()) {
            element.setAttribute(k, ffi.text_to_string(v));
        }
        for (const x of children) {
            element.appendChild(ffi.unbox(x));
        }
        element.classList.add("novella-element");
        return ffi.box(element);
    });
    ffi.defun("html.text", (x) => {
        const element = document.createElement("span");
        element.appendChild(document.createTextNode(ffi.text_to_string(x)));
        element.className = "novella-text";
        return ffi.box(element);
    });
    ffi.defun("html.role", (role0, child) => {
        const role = ffi.text_to_string(role0);
        const tag = role_to_tag(role);
        const element = document.createElement(tag);
        element.setAttribute("data-role", role);
        element.className = "novella-element";
        element.appendChild(ffi.unbox(child));
        return ffi.box(element);
    });
    ffi.defmachine("html.show", function* (canvas0, element0) {
        const canvas = get_canvas(canvas0);
        const element = ffi.unbox(element0);
        if (canvas.new_page === PageStatus.NEW_PAGE) {
            canvas.new_page = PageStatus.PAGE_RENDERING;
            canvas.mark = element;
            const old_opacity = element.style.opacity;
            element.style.opacity = "0";
            canvas.root.appendChild(element);
            yield ffi.await(scroll_to(canvas.root, element, 300).then((_) => ffi.nothing));
            element.style.opacity = old_opacity;
            element.classList.add("novella-appear");
        }
        else {
            canvas.root.appendChild(element);
            element.classList.add("novella-appear");
        }
        return ffi.nothing;
    });
    ffi.defmachine("html.wait", function* (canvas0) {
        const canvas = get_canvas(canvas0);
        yield ffi.await(click_to_continue(canvas, null).then((_) => ffi.nothing));
        canvas.new_page = PageStatus.NEW_PAGE;
        return ffi.nothing;
    });
    ffi.defun("html.make-canvas", (element) => {
        return ffi.box(new Canvas(ffi.unbox(element)));
    });
    ffi.defun("html.button", (element0, ref, value) => {
        const element = ffi.unbox(element0);
        const button = document.createElement("button");
        button.className = "novella-element novella-button";
        button.setAttribute("data-interactive", "true");
        button.appendChild(element);
        set_reference(ref, button, value);
        return ffi.box(button);
    });
    ffi.defmachine("html.wait-selection", function* (canvas0, ref) {
        const canvas = get_canvas(canvas0);
        const deferred = defer();
        const elements = refered_elements.get(ref);
        if (elements == null) {
            throw ffi.panic("no-refered-elements", `The reference ${ffi.to_debug_string(ref)} does not have any associated novella elements.`);
        }
        let listeners = [];
        for (const { value, element } of elements) {
            const listener = async (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                for (const x of elements) {
                    if (x.element !== element) {
                        x.element.setAttribute("data-selected", "false");
                    }
                }
                for (const { element, listener } of listeners) {
                    element.removeEventListener("click", listener);
                }
                element.setAttribute("data-selected", "true");
                await sleep(300);
                deferred.resolve(value);
            };
            listeners.push({ element, listener });
            element.addEventListener("click", listener, { once: true });
        }
        const result = yield ffi.await(deferred.promise);
        canvas.new_page = PageStatus.NEW_PAGE;
        return result;
    });
};
