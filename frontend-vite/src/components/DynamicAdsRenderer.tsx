import React, { useEffect, useRef, useState } from 'react';

const API_URL = 'http://localhost:8000/api';

interface Ad {
  id: number;
  title?: string;
  htmlCode?: string;
  targetLink?: string;
  placement: string;
}

const DynamicAdItem: React.FC<{ ad: Ad }> = ({ ad }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Track view
    fetch(`${API_URL}/dynamic-ads/${ad.id}/view`, { method: 'POST' }).catch(() => {});

    if (ad.htmlCode && containerRef.current) {
      containerRef.current.innerHTML = '';
      const parser = new DOMParser();
      const doc = parser.parseFromString(ad.htmlCode, 'text/html');
      
      Array.from(doc.body.childNodes).forEach(node => {
        if (node.nodeName === 'SCRIPT') {
          const script = document.createElement('script');
          const scriptElement = node as HTMLScriptElement;
          Array.from(scriptElement.attributes).forEach(attr => script.setAttribute(attr.name, attr.value));
          script.text = scriptElement.textContent || '';
          containerRef.current?.appendChild(script);
        } else {
          containerRef.current?.appendChild(node.cloneNode(true));
        }
      });
    }
  }, [ad]);

  const handleClick = () => {
    fetch(`${API_URL}/dynamic-ads/${ad.id}/click`, { method: 'POST' }).catch(() => {});
    if (ad.targetLink) {
      window.open(ad.targetLink, '_blank');
    }
  };

  if (ad.htmlCode) {
    return (
      <div 
        ref={containerRef}
        onClick={ad.targetLink ? handleClick : undefined}
        className={`my-5 overflow-hidden flex justify-center ${ad.targetLink ? 'cursor-pointer' : 'cursor-default'}`}
      />
    );
  }

  if (ad.targetLink && ad.title) {
    return (
      <div 
        onClick={handleClick}
        className="my-5 p-5 border border-primary/20 hover:border-primary/50 transition-colors rounded-2xl text-center bg-primary/5 cursor-pointer flex flex-col items-center justify-center min-h-[100px]"
      >
        <h3 className="m-0 text-primary font-bold text-lg">{ad.title}</h3>
        <p className="text-sm text-slate-500 mt-2 font-semibold uppercase tracking-wider text-[10px]">إعلان ممول / Sponsored</p>
      </div>
    );
  }

  return null;
};

const DynamicAdsRenderer: React.FC<{ placement: string }> = ({ placement }) => {
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/dynamic-ads?placement=${encodeURIComponent(placement)}`)
      .then(res => res.json())
      .then(data => {
         if (Array.isArray(data)) setAds(data);
      })
      .catch(() => {});
  }, [placement]);

  if (ads.length === 0) return null;

  return (
    <div className="w-full">
      {ads.map(ad => (
        <DynamicAdItem key={ad.id} ad={ad} />
      ))}
    </div>
  );
};

export default DynamicAdsRenderer;
