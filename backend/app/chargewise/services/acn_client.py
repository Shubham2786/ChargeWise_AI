"""ACN Data API client."""
import os
import requests
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

class ACNClient:
    """Client for fetching EV charging session data from ACN API."""
    
    def __init__(self, token: Optional[str] = None, base_url: Optional[str] = None):
        self.token = token or os.getenv("ACN_TOKEN")
        self.base_url = base_url or os.getenv("ACN_BASE_URL", "https://ev.caltech.edu/api/v1")
        self.auth = (self.token, "")
    
    def fetch_sessions(self, site_id: str = "caltech", min_kwh: float = 0.0, limit: int = 1000, max_pages: int = 1) -> List[Dict]:
        """
        Fetch charging sessions with pagination support and basic retry logic.
        
        Args:
            site_id: The site to fetch sessions for (e.g. 'caltech', 'jpl')
            min_kwh: Minimum kWhDelivered filter
            limit: Max sessions per page
            max_pages: Maximum number of pages to fetch (default 1 for quick ingestion)
            
        Returns:
            List of raw session dictionaries
        """
        import time
        sessions = []
        url = f"{self.base_url}/sessions/{site_id}"
        params = {"limit": limit}
        
        if min_kwh > 0:
            params["kWhDelivered"] = f"gte:{min_kwh}"
        
        pages_fetched = 0
        while url and pages_fetched < max_pages:
            retries = 0
            max_retries = 3
            data = None
            
            while retries <= max_retries:
                try:
                    response = requests.get(url, auth=self.auth, params=params, timeout=10)
                    response.raise_for_status()
                    data = response.json()
                    break
                except requests.exceptions.RequestException as e:
                    retries += 1
                    if retries > max_retries:
                        print(f"❌ ACN API request failed after {max_retries} retries: {e}")
                        raise
                    
                    backoff_time = 2 ** retries
                    print(f"⚠️ API request failed: {e}. Retrying in {backoff_time}s... ({retries}/{max_retries})")
                    time.sleep(backoff_time)
            
            sessions.extend(data.get("_items", []))
            pages_fetched += 1
            
            # Handle pagination
            next_url = data.get("_links", {}).get("next", {}).get("href")
            if next_url and pages_fetched < max_pages:
                import urllib.parse
                # Ensure the base URL ends with a slash for proper urljoin
                base = self.base_url if self.base_url.endswith('/') else self.base_url + '/'
                url = urllib.parse.urljoin(base, next_url)
            else:
                url = None
            params = {}  # Clear params for next page (already in URL)
        
        return sessions
