terraform {
  required_version = ">= 1.6.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.39"
    }
  }

  # State bucket is created once, manually, before the first `terraform
  # init` — see README.md "One-Time Infrastructure Setup". Bucket name is
  # hardcoded (not passed via -backend-config) since this project has
  # exactly one environment.
  backend "gcs" {
    bucket = "ashendeng-dev-tfstate"
    prefix = "champ-of-exodus"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
