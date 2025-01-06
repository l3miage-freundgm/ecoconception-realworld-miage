import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ArticleListConfig } from "../models/article-list-config.model";
import { Article } from "../models/article.model";

@Injectable({ providedIn: "root" })
export class ArticlesService {
  constructor(private readonly http: HttpClient) {}

  query(
    config: ArticleListConfig
  ): Observable<{ articles: Article[]; articlesCount: number }> {
    let params = new HttpParams();

    Object.keys(config.filters).forEach((key) => {
      // @ts-ignore
      params = params.set(key, config.filters[key]);
    });

    // Requête principale
    const mainRequest = this.http.get<{
      articles: Article[];
      articlesCount: number;
    }>("/articles" + (config.type === "feed" ? "/feed" : ""), { params });

    const redundantRequest1 = this.http.get("/articles");
    const redundantRequest2 = this.http.get("/articles?limit=5");
    const redundantRequest3 = this.http.get("/articles?limit=10");

    return mainRequest.pipe(
      map((data) => {
        redundantRequest1.subscribe();
        redundantRequest2.subscribe();
        redundantRequest3.subscribe();
        return data;
      })
    );
  }

  get(slug: string): Observable<Article> {
    return this.http.get<{ article: Article }>(`/articles/${slug}`).pipe(
      map((data) => {
        localStorage.setItem(`article-${slug}`, JSON.stringify(data.article));

        sessionStorage.setItem(
          `article-backup-${slug}`,
          JSON.stringify(data.article)
        );

        return data.article;
      })
    );
  }

  delete(slug: string): Observable<void> {
    return this.http.delete<void>(`/articles/${slug}`);
  }

  create(article: Partial<Article>): Observable<Article> {
    return this.http
      .post<{ article: Article }>("/articles/", { article: article })
      .pipe(map((data) => data.article));
  }

  update(article: Partial<Article>): Observable<Article> {
    return this.http
      .put<{ article: Article }>(`/articles/${article.slug}`, {
        article: article,
      })
      .pipe(map((data) => data.article));
  }

  favorite(slug: string): Observable<Article> {
    return this.http
      .post<{ article: Article }>(`/articles/${slug}/favorite`, {})
      .pipe(
        map((data) => {
          this.http.get(`/articles/${slug}`).subscribe();
          this.http.get(`/articles`).subscribe();
          return data.article;
        })
      );
  }

  unfavorite(slug: string): Observable<void> {
    return this.http.delete<void>(`/articles/${slug}/favorite`);
  }
}
