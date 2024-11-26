gcloud functions deploy post_processing_service \
    --runtime python39 \
    --trigger-topic post-upload-processing \
    --entry-point process_book_upload \
    --retry \
    --memory 256MB \
    --timeout 180s \
    --service-account=upload-post-processing@superreader-442520.iam.gserviceaccount.com