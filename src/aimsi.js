// Parser for the scanner's "AIMsi" pipe-delimited output. This is what the
// shop's ID scanner actually emits (NOT raw AAMVA) — one line, fields split by
// "|", positional. Produces the same normalized shape the fill engine expects.
//
// Observed sample (one physical line):
//   AIMsi|1.0|002070974|7422 E EASTER WAY||USA|80112-0000|CO|CENTENNIAL|
//   JAMES|DENNIS|MURPHREE|07/09/1985|07/09/2031|235|74|1|BRO|BRO|U||
//
// Field positions (0-based after split on "|"):
//   0 tag "AIMsi"      1 version         2 DL/ID number     3 street
//   4 street2          5 country         6 zip (ZIP+4)      7 state (2-letter)
//   8 city             9 first          10 middle          11 last
//  12 DOB MM/DD/YYYY  13 expiry         14 weight (lb)     15 height (in)
//  16 sex (1=M,2=F)   17 eye            18 hair            19+ misc
// NOTE: this format carries NO name suffix (III/Jr/etc.) — must be entered by hand.
(function () {
  const TJID = (window.TJID = window.TJID || {});

  const IDX = {
    idNumber: 2, address1: 3, address2: 4, country: 5, zip: 6, state: 7,
    city: 8, first: 9, middle: 10, last: 11, dob: 12, exp: 13,
    weight: 14, height: 15, sex: 16, eye: 17, hair: 18,
  };

  const title = (s) =>
    (s || "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).trim();

  function looksLikeScan(t) {
    return /^\s*AIMsi\s*\|/i.test(t || "");
  }

  function parse(text) {
    const p = String(text).trim().split("|");
    const g = (i) => (p[i] || "").trim();

    const dobRaw = g(IDX.dob); // MM/DD/YYYY
    const [dm = "", dd = "", dy = ""] = dobRaw.split("/");
    const pad2 = (s) => s.padStart(2, "0");

    const sexCode = g(IDX.sex);
    const sex = sexCode === "1" ? "M" : sexCode === "2" ? "F" : sexCode ? "X" : "";
    const sexWord = sex === "M" ? "Male" : sex === "F" ? "Female" : "";

    const stateCode = g(IDX.state).toUpperCase().slice(0, 2);
    const stateName = TJID.states ? TJID.states.abbrToName(stateCode) : "";

    const zipDigits = g(IDX.zip).replace(/\D/g, "");
    const country = g(IDX.country) || "USA";

    const first = title(g(IDX.first));
    const middle = title(g(IDX.middle));
    const last = title(g(IDX.last));

    const data = {
      firstName: first,
      middleName: middle,
      middleNameOrNMN: middle || "NMN",
      lastName: last,
      suffix: "", // AIMsi format does not export a name suffix
      fullName: [first, middle, last].filter(Boolean).join(" "),

      sex, sexWord, sexCode,

      dobUS: dobRaw,
      dobMonth: dm ? pad2(dm) : "",
      dobDay: dd ? pad2(dd) : "",
      dobYear: dy,
      dobISO: dy && dm && dd ? `${dy}-${pad2(dm)}-${pad2(dd)}` : "",

      expiryUS: g(IDX.exp),

      address1: title(g(IDX.address1)),
      address2: title(g(IDX.address2)),
      city: title(g(IDX.city)),
      stateCode, stateName,
      zip5: zipDigits.slice(0, 5),
      zip9: zipDigits.length >= 9 ? `${zipDigits.slice(0, 5)}-${zipDigits.slice(5, 9)}` : zipDigits.slice(0, 5),

      idNumber: g(IDX.idNumber),
      idStateCode: stateCode,
      idStateName: stateName,

      country,
      countryName: /can/i.test(country) ? "Canada" : "United States",

      heightInches: g(IDX.height),
      weightLb: g(IDX.weight),
      eyeColor: g(IDX.eye),
      hairColor: g(IDX.hair),

      // Flags for the UI: this format can't provide a suffix.
      _format: "aimsi",
      _suffixUnavailable: true,
    };

    return { data, parts: p };
  }

  TJID.aimsi = { parse, looksLikeScan, IDX };
})();
