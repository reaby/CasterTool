console.log(Buffer.from("EdbzfLXMS_aI_PjZCVaygQ", "base64").toString("hex").replace(/([0-z]{8})([0-z]{4})([0-z]{4})([0-z]{4})([0-z]{12})/,"$1-$2-$3-$4-$5"));
console.log(Buffer.from("11d6f37c-b5cc-4bf6-88fc-f8d90956b281".replaceAll("-",""), "hex").toString("base64url"));
