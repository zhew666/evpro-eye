import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-accent mb-4">404</h1>
        <p className="text-xl text-text mb-2">找不到這個頁面</p>
        <p className="text-text-muted mb-8">
          你要找的頁面不存在或已經移動。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-accent text-primary font-bold rounded-lg hover:bg-accent-hover transition-colors"
          >
            回到首頁
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center justify-center px-6 py-3 border border-accent/30 text-accent font-semibold rounded-lg hover:bg-accent/10 transition-colors"
          >
            瀏覽文章
          </Link>
        </div>
      </div>
    </div>
  );
}
