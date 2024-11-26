gcloud functions deploy content_distill_service \
    --runtime python39 \
    --trigger-topic content-distill-processing \
    --entry-point process_content_distill \
    --retry \
    --memory 256MB \
    --timeout 180s \
    --service-account=content-distill@superreader-442520.iam.gserviceaccount.com