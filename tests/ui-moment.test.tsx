import test from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import { JSDOM } from "jsdom";
import { createRoot } from "react-dom/client";
import { createKinshipApiApp } from "../server/apiRouter";
import { App } from "../src/App";

test("profile to result and save/remove journey through the real HTTP API (DOM simulation)", async () => {
  const server = createKinshipApiApp().listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw Error("No address");
  const base = `http://127.0.0.1:${address.port}`;
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: base });
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    localStorage: dom.window.localStorage,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  dom.window.scrollTo = () => {};
  Object.defineProperty(dom.window, "innerWidth", {
    value: 360,
    configurable: true,
  });
  const originalFetch = globalThis.fetch;
  const requestBodies: string[] = [];
  globalThis.fetch = (input, init) => {
    if (typeof init?.body === "string") requestBodies.push(init.body);
    return originalFetch(new URL(String(input), base), init);
  };
  const root = createRoot(dom.window.document.getElementById("root")!);
  const click = async (text: string) => {
    const button = [...dom.window.document.querySelectorAll("button")].find(
      (x) => x.textContent?.trim().includes(text),
    );
    assert.ok(button, `missing button ${text}`);
    await act(async () => {
      button.click();
      await new Promise((r) => setTimeout(r, 20));
    });
  };
  try {
    await act(async () => {
      root.render(<App />);
      await new Promise((r) => setTimeout(r, 30));
    });
    assert.match(
      dom.window.document.body.textContent || "",
      /A little introduction/,
    );
    const exampleDetails: Record<string, string> = {
      "onboarding-name": "FictionalName",
      "onboarding-surname": "FictionalSurname",
      "onboarding-age": "72",
      "onboarding-birth-country": "FictionalBirthland",
      "onboarding-residence-country": "FictionalResidence",
    };
    for (const [id, value] of Object.entries(exampleDetails)) {
      const input = dom.window.document.getElementById(
        id,
      ) as HTMLInputElement | null;
      assert.ok(input, `missing onboarding field ${id}`);
      assert.ok(dom.window.document.querySelector(`label[for="${id}"]`));
      assert.equal(input.required, false);
      input.value = value;
    }
    await click("Continue to Kinship");
    assert.match(
      dom.window.document.body.textContent || "",
      /Make room for a.*meaningful moment/,
    );
    assert.equal(dom.window.localStorage.length, 0);
    assert.equal(dom.window.document.getElementById("onboarding-name"), null);
    await click("Explore an example");
    for (
      let i = 0;
      i < 50 &&
      !dom.window.document.body.textContent?.includes("Here’s a little idea");
      i++
    )
      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });
    assert.match(
      dom.window.document.body.textContent || "",
      /Demonstration mode · illustrative suggestion/,
    );
    assert.match(dom.window.document.body.textContent || "", /Gardening/);
    await click("Save this moment");
    assert.equal(
      JSON.parse(dom.window.localStorage.getItem("kinship.moments.v1") || "[]")
        .length,
      1,
    );
    for (const value of [
      "FictionalName",
      "FictionalSurname",
      "FictionalBirthland",
      "FictionalResidence",
    ]) {
      assert.ok(
        !requestBodies.some((body) => body.includes(value)),
        `onboarding value ${value} was sent`,
      );
      assert.ok(
        !JSON.stringify(dom.window.localStorage).includes(value),
        `onboarding value ${value} was stored`,
      );
    }
    await click("Saved moments");
    assert.match(dom.window.document.body.textContent || "", /SAVED MOMENT/);
    await click("Remove");
    assert.equal(
      JSON.parse(dom.window.localStorage.getItem("kinship.moments.v1") || "[]")
        .length,
      0,
    );
    await act(async () => {
      root.render(<App key="new-session" />);
    });
    await click("Skip for now");
    assert.match(
      dom.window.document.body.textContent || "",
      /Make room for a.*meaningful moment/,
    );
  } finally {
    await act(async () => root.unmount());
    globalThis.fetch = originalFetch;
    dom.window.close();
    server.close();
  }
});
