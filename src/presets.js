// Built-in site presets. A preset maps normalized license fields to a specific
// site's form controls. Presets are matched by DOM signature (not hostname),
// because a site like Colorado InstaCheck is served from several hosts/IPs.
(function () {
  const TJID = (window.TJID = window.TJID || {});

  const PRESETS = [
    {
      id: "co-instacheck",
      name: "Colorado InstaCheck (CBI Background Check)",
      // Signature: the applicant name + split DOB fields are unique to this form.
      detect: () =>
        !!document.getElementById("fna") &&
        !!document.getElementById("dobM") &&
        !!document.getElementById("idNumber"),
      fields: [
        // 1. Transferee's full name
        { sel: "#fna", attr: "firstName" },
        { sel: "#mna", attr: "middleNameOrNMN" },
        { sel: "#lna", attr: "lastName" },
        { sel: "#sfx", attr: "suffix" },
        // 3. Sex (async <select> inside #genderDiv)
        { sel: "#genderDiv select", attr: "sexWord", kind: "select" },
        // 6. Date of birth (three boxes)
        { sel: "#dobM", attr: "dobMonth" },
        { sel: "#dobD", attr: "dobDay" },
        { sel: "#dobY", attr: "dobYear" },
        // 7. Address of residence
        { sel: "#adr", attr: "address1" },
        { sel: "#cty", attr: "city" },
        { sel: "#stateDiv select", attr: "stateCode", kind: "stateSelect" },
        { sel: "#zip", attr: "zip5" },
        // 8. Identification information (dropdown lists full state NAMES)
        { sel: "#idNumber", attr: "idNumber" },
        { sel: "#idStateDiv select", attr: "idStateCode", kind: "stateSelect" },
      ],
      // Fields intentionally NOT auto-filled (not derivable from a license):
      //   #ssn1-3 (SSN), #raceDiv (Race), #aka (AKA), #upin (IDT/UPIN),
      //   #ctzDiv (Citizenship — barcode carries issuing country, not citizenship),
      //   gun/sale type, and dealer contact (#fnaD/#lnaD, auto-filled at login).
    },
  ];

  TJID.presets = {
    all: PRESETS,
    detect() {
      return PRESETS.find((p) => {
        try { return p.detect(); } catch { return false; }
      }) || null;
    },
    byId: (id) => PRESETS.find((p) => p.id === id) || null,
  };
})();
