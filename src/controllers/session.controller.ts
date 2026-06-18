import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const startSession = asyncHandler(async (req, res) => {
  return res.status(410).json(
    new ApiResponse(
      410,
      null,
      "Session routes are disabled. Use /api/v1/kata-test/sequence instead.",
    ),
  );
});


export const getSessions =
  asyncHandler(async (req, res) => {
    return res.status(410).json(
      new ApiResponse(
        410,
        null,
        "Session routes are disabled. Use /api/v1/kata-test/sequence instead."
      )
    );
  });

  export const getSessionById =
  asyncHandler(async (req, res) => {
    return res.status(410).json(
      new ApiResponse(
        410,
        null,
        "Session routes are disabled. Use /api/v1/kata-test/sequence instead."
      )
    );
  });

  export const updateSequence =
  asyncHandler(async (req, res) => {
    return res.status(410).json(
      new ApiResponse(
        410,
        null,
        "Session routes are disabled. Use /api/v1/kata-test/save-sequence instead."
      )
    );
  });
