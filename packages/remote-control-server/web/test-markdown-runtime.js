import { marked } from "marked";
import filterXSS from "xss";

globalThis.marked = marked;
globalThis.filterXSS = filterXSS;
