# Keep the HTTP and HTTPS docs routes identical. This file is mounted with the
# rest of conf.d but is not auto-loaded because it intentionally uses .inc.
location = /docs {
  root /usr/share/nginx/matrix-site;
  try_files /docs.html =404;
}

location = /docs/ {
  root /usr/share/nginx/matrix-site;
  try_files /docs.html =404;
}
