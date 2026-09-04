# Still-first media metadata

MEDIA_REQUIREMENT defaults to STILL_SEQUENCE, minimum 1, recommended 3, maximum 4 images, START/KEY_POSITION/FINISH views, LOW motion complexity, video_recommended false, video_required false, technical review true and rights review true. A selected requirement can represent NONE or SINGLE_STILL with consistent counts/views, or optional/recommended video. Required views must be distinct and fit the maximum. No request can set video_required true in Phase B.

MEDIA_ASSET holds type IMAGE/VIDEO/ILLUSTRATION/DIAGRAM/AUDIO, optional view, storage locator, checksum, dimensions/duration, creator, author, provenance/citations, rights reference and effective date. Version state and review history provide publication and technical/rights status. Inbound links reveal the exercise versions using an asset. Locators are inert metadata; the server neither fetches them nor transcodes or renders remote media.

Asset publication requires explicit technical and rights reviews plus independent approval, even for commissioned/generated assets in later work. Exercise publication checks still counts, required views and published asset references. Video does not substitute for required still views. There are no production images or videos in the seed: automated tests use synthetic metadata-only locators to exercise the gate, with no media generation/import.
