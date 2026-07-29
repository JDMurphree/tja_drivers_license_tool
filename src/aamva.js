// AAMVA PDF417 driver's-license parser.
// A keyboard-wedge scanner "types" the whole barcode; this turns that raw
// string into clean, normalized fields. Standard: AAMVA DL/ID Card Design.
(function () {
  const TJID = (window.TJID = window.TJID || {});

  // 3-letter element codes we care about. Full list is larger; these cover
  // everything a US/CA license carries that a form might want.
  const CODES = {
    DCS: "lastName",       // Family name
    DAC: "firstName",      // First name
    DAD: "middleName",     // Middle name
    DCU: "suffix",         // Name suffix (JR, SR, III...)
    DBB: "dobRaw",         // Date of birth
    DBA: "expiryRaw",      // Expiration date
    DBD: "issuedRaw",      // Issue date
    DBC: "sexCode",        // 1=male, 2=female, 9=unspecified
    DAG: "address1",       // Street 1
    DAH: "address2",       // Street 2
    DAI: "city",
    DAJ: "stateCode",      // 2-letter jurisdiction
    DAK: "zipRaw",         // Postal code (may be 9 digits, no dash)
    DAQ: "idNumber",       // License / ID number
    DCG: "country",        // USA / CAN
    DAU: "heightRaw",      // e.g. "069 in" or "175 cm"
    DAW: "weightLb",
    DAY: "eyeColor",
    DAZ: "hairColor",
    DCF: "docDiscriminator",
  };

  // Left-pad helper.
  const pad = (s, n) => String(s).padStart(n, "0");

  // Dates are MMDDCCYY for USA jurisdictions, CCYYMMDD for Canada.
  function parseDate(raw, country) {
    if (!raw || raw.length < 8) return null;
    const d = raw.slice(0, 8).replace(/\D/g, "");
    if (d.length < 8) return null;
    let mm, dd, yyyy;
    if (country === "CAN") {
      yyyy = d.slice(0, 4); mm = d.slice(4, 6); dd = d.slice(6, 8);
    } else {
      mm = d.slice(0, 2); dd = d.slice(2, 4); yyyy = d.slice(4, 8);
    }
    const mi = +mm, di = +dd, yi = +yyyy;
    if (mi < 1 || mi > 12 || di < 1 || di > 31 || yi < 1900) return null;
    return { mm, dd, yyyy, iso: `${yyyy}-${mm}-${dd}`, us: `${mm}/${dd}/${yyyy}` };
  }

  function parseHeight(raw) {
    if (!raw) return null;
    const m = raw.match(/(\d+)\s*(in|cm)?/i);
    if (!m) return null;
    let inches = +m[1];
    if (/cm/i.test(raw)) inches = Math.round(inches / 2.54);
    return inches;
  }

  // Split the raw wedge string into { CODE: value } pairs.
  // Elements are LF-delimited; a "DL"/"ID" subfile tag may prefix the first one.
  function rawToCodes(text) {
    const out = {};
    const lines = text.split(/[\r\n]+/);
    for (let line of lines) {
      line = line.trim();
      if (line.length < 3) continue;
      // Strip a leading subfile designator ("DL"/"ID") if what follows is a code.
      let candidate = line;
      const withoutSub = line.replace(/^(?:DL|ID)/, "");
      if (CODES[withoutSub.slice(0, 3)]) candidate = withoutSub;
      const code = candidate.slice(0, 3);
      if (CODES[code] && out[code] === undefined) {
        out[code] = candidate.slice(3).trim();
      }
    }
    return out;
  }

  // Quick sanity check that a captured burst is actually a license scan.
  function looksLikeScan(text) {
    if (!text) return false;
    if (/ANSI\b/.test(text) || /@/.test(text.slice(0, 3))) {
      // At least a couple of real elements present.
      const codes = rawToCodes(text);
      return Boolean(codes.DCS || codes.DAC || codes.DAQ);
    }
    return false;
  }

  function parse(text) {
    const c = rawToCodes(text);
    const country = c.DCG || "USA";
    const dob = parseDate(c.DBB, country);
    const expiry = parseDate(c.DBA, country);
    const issued = parseDate(c.DBD, country);

    const sexCode = (c.DBC || "").trim();
    const sex = sexCode === "1" ? "M" : sexCode === "2" ? "F" : sexCode ? "X" : "";
    const sexWord = sex === "M" ? "Male" : sex === "F" ? "Female" : "";

    const zipRaw = (c.DAK || "").replace(/\D/g, "");
    const zip5 = zipRaw.slice(0, 5);
    const zip9 = zipRaw.length >= 9 ? `${zipRaw.slice(0, 5)}-${zipRaw.slice(5, 9)}` : zip5;

    const stateCode = (c.DAJ || "").toUpperCase().slice(0, 2);
    const stateName = TJID.states ? TJID.states.abbrToName(stateCode) : "";

    const title = (s) =>
      (s || "").toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase()).trim();

    const data = {
      firstName: title(c.DAC),
      middleName: title(c.DAD),
      middleNameOrNMN: c.DAD ? title(c.DAD) : "NMN",
      lastName: title(c.DCS),
      suffix: (c.DCU || "").toUpperCase(),
      fullName: [title(c.DAC), title(c.DAD), title(c.DCS)].filter(Boolean).join(" "),

      sex, sexWord, sexCode,

      dobISO: dob ? dob.iso : "",
      dobUS: dob ? dob.us : "",
      dobMonth: dob ? dob.mm : "",
      dobDay: dob ? dob.dd : "",
      dobYear: dob ? dob.yyyy : "",

      expiryUS: expiry ? expiry.us : "",
      issuedUS: issued ? issued.us : "",

      address1: title(c.DAG),
      address2: title(c.DAH),
      city: title(c.DAI),
      stateCode, stateName,
      zip5, zip9,

      idNumber: (c.DAQ || "").trim(),
      idStateCode: stateCode,
      idStateName: stateName,

      country,
      countryName: country === "CAN" ? "Canada" : "United States",

      heightInches: parseHeight(c.DAU),
      weightLb: (c.DAW || "").trim(),
      eyeColor: (c.DAY || "").trim(),
      hairColor: (c.DAZ || "").trim(),
    };

    return { data, codes: c };
  }

  TJID.aamva = { parse, looksLikeScan, CODES };
})();
