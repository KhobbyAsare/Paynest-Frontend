import axios from "axios";
import toast from "react-hot-toast";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyRecord = Record<string, any>;

function joinMessages(msgs: string[]): string {
  return msgs.filter(Boolean).join("; ");
}

function extractFromDetail(detail: any): string[] {
  try {
    if (!detail) return [];
    if (typeof detail === "string") return [detail];
    if (Array.isArray(detail)) {
      return detail
        .map((d) => {
          if (!d) return "";
          if (typeof d === "string") return d;
          const loc = Array.isArray(d.loc)
            ? d.loc.filter((x: unknown) => typeof x === "string").at(-1)
            : d.field || d.path || "";
          const msg = d.msg || d.message || d.detail || String(d);
          return loc ? `${loc}: ${msg}` : msg;
        })
        .filter(Boolean);
    }
    if (typeof detail === "object") {
      const msg = (detail.msg || detail.message || detail.detail) as string | undefined;
      return msg ? [msg] : [];
    }
    return [];
  } catch {
    return [];
  }
}

function extractMessageFromData(data: any): string | string[] {
  try {
    if (!data) return "";
    if (typeof data === "string") return data;

    // Common API shapes
    if (typeof data.detail !== "undefined") {
      const fromDetail = extractFromDetail(data.detail);
      if (fromDetail.length) return fromDetail;
      if (typeof data.detail === "string") return data.detail;
    }

    if (typeof data.message === "string") return data.message;
    if (typeof data.error === "string") return data.error;
    if (typeof data.msg === "string") return data.msg;

    if (Array.isArray(data.errors)) {
      const list = extractFromDetail(data.errors);
      if (list.length) return list;
    }

    if (data.errors && typeof data.errors === "object") {
      const collected: string[] = [];
      Object.entries(data.errors as AnyRecord).forEach(([key, val]) => {
        if (!val) return;
        if (Array.isArray(val)) {
          const joined = (val as unknown[])
            .map((v) => (typeof v === "string" ? v : (v as AnyRecord)?.msg || (v as AnyRecord)?.message))
            .filter(Boolean)
            .join(", ");
          if (joined) collected.push(`${key}: ${joined}`);
        } else if (typeof val === "string") {
          collected.push(`${key}: ${val}`);
        } else if (typeof val === "object") {
          const inner = (val as AnyRecord).message || (val as AnyRecord).msg || (val as AnyRecord).detail;
          if (inner) collected.push(`${key}: ${inner}`);
        }
      });
      if (collected.length) return collected;
    }

    // Some APIs wrap errors differently (e.g., { status: 'error', data: { message } })
    if (data.data) {
      const inner = extractMessageFromData(data.data);
      if (Array.isArray(inner)) return inner;
      if (typeof inner === "string" && inner) return inner;
    }

    return "";
  } catch {
    return "";
  }
}

export function getErrorMessage(error: any, fallback = "Something went wrong"): string {
  // Axios error
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as AnyRecord | string | undefined;

    // Prefer messages coming from the API payload
    let messages: string[] = [];
    const extracted = extractMessageFromData(data);
    if (Array.isArray(extracted)) messages = extracted;
    else if (typeof extracted === "string" && extracted.trim()) messages = [extracted];

    // If nothing was extracted, fall back to status-specific defaults
    if (messages.length === 0) {
      switch (status) {
        case 400:
          messages = ["Bad request. Please check your input and try again."];
          break;
        case 401:
          messages = ["Your session has expired. Please sign in again."];
          break;
        case 403:
          messages = ["You do not have permission to perform this action."];
          break;
        case 404:
          messages = ["The requested resource was not found."];
          break;
        case 409:
          messages = ["A conflict occurred. Please review and try again."];
          break;
        case 422:
          messages = ["Validation failed. Please check your input and try again."];
          break;
        default:
          if (typeof status === "number" && status >= 500) {
            messages = ["A server error occurred. Please try again later."];
          }
      }
    }

    // Network or CORS errors (no response)
    if (!error.response) {
      if ((error as any)?.code === "ECONNABORTED") {
        return "The request timed out. Please try again.";
      }
      const isNetwork = String(error.message || "").toLowerCase().includes("network");
      if (isNetwork) return "Network error. Please check your internet connection and try again.";
      return fallback;
    }

    // Fall back to error.message if present, then to provided fallback
    if (messages.length === 0 && error.message) {
      messages = [error.message];
    }

    return joinMessages(messages) || fallback;
  }

  // Non-Axios errors
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === "string") return error || fallback;
  return fallback;
}

export function handleErrorMessage(error: any, message = "Something went wrong"): void {
  const finalMessage = getErrorMessage(error, message);
  toast.error(finalMessage);
}
