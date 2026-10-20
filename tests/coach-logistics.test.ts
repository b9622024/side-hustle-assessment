import { describe, expect, it } from "vitest";
import { formatCoachConsultationLogistics } from "../src/consultation/logistics";

describe("coach consultation logistics presentation", () => {
  it("shows the recorded residence and mapped consultation mode", () => {
    const display = formatCoachConsultationLogistics({
      current_residence: "新北市",
      consultation_mode: "IN_PERSON",
      consultation_mode_label: "實體見面（台北／新北）",
    });
    expect(display).toEqual({
      currentResidence: "新北市",
      consultationMode: "實體見面（台北／新北）",
    });
  });

  it("never guesses current residence from birth place on legacy records", () => {
    expect(formatCoachConsultationLogistics(null)).toEqual({
      currentResidence: "尚未蒐集",
      consultationMode: "尚未蒐集",
    });
    expect(formatCoachConsultationLogistics(undefined).currentResidence).toBe("尚未蒐集");
  });

  it("distinguishes a deliberate nondisclosure from missing old data", () => {
    expect(formatCoachConsultationLogistics({
      current_residence: "未提供",
      consultation_mode: "UNDECIDED",
      consultation_mode_label: "目前還不確定",
    })).toEqual({
      currentResidence: "暫不提供",
      consultationMode: "目前還不確定",
    });
  });

  it("displays online or flexible preferences without modifying assessment fields", () => {
    expect(formatCoachConsultationLogistics({
      current_residence: "台南市",
      consultation_mode: "ONLINE",
      consultation_mode_label: "線上視訊",
    }).consultationMode).toBe("線上視訊");
    expect(formatCoachConsultationLogistics({
      current_residence: "台北市",
      consultation_mode: "EITHER",
      consultation_mode_label: "兩種方式都可以",
    }).consultationMode).toBe("兩種方式都可以");
  });
});
