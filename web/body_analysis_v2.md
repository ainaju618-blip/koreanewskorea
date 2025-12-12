# article-body 분석
시작 위치: 33165

## HTML 구조 (처음 3000자)
```html
<div class="article-body">	
	<article class="article-sytool-container">
		<div class="article-sytool">
			<div class="helper-tool-group">
				<button type="button" class="helper-tool page-share" title="공유" aria-label="공유" data-open="article-sns"></button>
				<button type="button" class="helper-tool page-scrap" data-idxno="90000015817" title="기사스크랩" aria-label="기사스크랩"></button>
				<button type="button" class="helper-tool page-print" onclick="articlePrint('90000015817')" title="인쇄" aria-label="인쇄"></button>
				<div class="dropdown">
					<button type="button" class="helper-tool font-size" title="글자크기 설정" aria-label="글자크기설정" data-toggle="fontsize-dropdown"></button>
					<div id="fontsize-dropdown" class="dropdown-pane right bottom fontsize-dropdown" data-dropdown data-position="right" data-alignment="top" data-h-offset="8" data-close-on-click="true">
						<article class="fontsize-container">
							<header class="fontsize-header">
								<div class="fontsize-title">글자크기 설정</div>
								<button type="button" class="btn-close ms-auto" aria-label="Close font size setting"></button>
							</header>
							<section class="fontsize-body">
								<div class="fontsize-slider">
									<div class="fontsize-slider-text">가</div>
									<div class="fontsize-slider-bar">
										<li class="fontsize-slider-item" aria-label="작게" data-step="1" data-fontsize="16"></li>
										<li class="fontsize-slider-item active" aria-label="보통" data-step="2" data-fontsize="18"></li>
										<li class="fontsize-slider-item" aria-label="크게" data-step="3" data-fontsize="20"></li>
										<li class="fontsize-slider-item" aria-label="아주크게" data-step="4" data-fontsize="22"></li>
										<li class="fontsize-slider-item" aria-label="최대크게" data-step="5" data-fontsize="24"></li>
									</div>
									<div class="fontsize-slider-text for-large">가</div>
								</div>
								<div class="fontsize-preview">기사의 본문 내용은 이 글자크기로 변경됩니다.</div>
							</section>
						</article>
					</div>
				</div>
			</div>
		</div>
		<div id="article-view-content-div" class="article-veiw-body view-page" itemprop="articleBody">		
			<div style="text-align:center">
<figure class="photo-layout image photo_516043 float-center" data-idxno="516043" data-type="photo" style="display:inline-block; max-width:600px"><img alt="프로축구 광주FC가 6일 오후 1시 30분 서울월드컵경기장에서 열린 하나은행 코리아컵 결승전에서 전북에 1-2로 패배했다. 사진은 이날 동점골을 터트린 프리드욘슨. 광주FC 제공" height="400" loading="lazy" src="https://cdn.jnilbo.com/news/photo/202512/90000015817_516043_2923.jpg" width="600" />
<figcaption>프로축구 광주FC가 6일 오후 1시 30분 서울월드컵경기장에서 열린 하나은행 코리아컵 결승전에서 전북에 1-2로 패배했다. 사진은 이날 동점골을 터트린 프리드욘슨. 광주FC 제공</figcaption>
</figure>
</div>

<p>프로축구 광주FC가 창단 첫 코리아컵 우승을 노렸지만 아쉽게 준우승에 그쳤다.</p>

<p>광주는 6일 1시 30분 서울월드컵경기장에서 열린 하나은행 코리아컵 결승전에서 전북 현대모터스를 상대로 1-2로 패배했다.</p>

<p>광주는 4-4-2 포메이션으로 나섰다.</p>

<p>신창무와 헤이스가 투톱을 형성했으며 하승운, 유제호, 주세종, 신창무가 미드필더에 배치됐다.</p>

<p>수비에는 심상민, 진시우, 변준수, 조성권이 출전했으며 김경민이 골문을 지켰다.</p>

```

## 텍스트만 추출
```
글자크기 설정 가 가 기사의 본문 내용은 이 글자크기로 변경됩니다. 프로축구 광주FC가 6일 오후 1시 30분 서울월드컵경기장에서 열린 하나은행 코리아컵 결승전에서 전북에 1-2로 패배했다. 사진은 이날 동점골을 터트린 프리드욘슨. 광주FC 제공 프로축구 광주FC가 창단 첫 코리아컵 우승을 노렸지만 아쉽게 준우승에 그쳤다. 광주는 6일 1시 30분 서울월드컵경기장에서 열린 하나은행 코리아컵 결승전에서 전북 현대모터스를 상대로 1-2로 패배했다. 광주는 4-4-2 포메이션으로 나섰다. 신창무와 헤이스가 투톱을 형성했으며 하승운, 유제호, 주세종, 신창무가 미드필더에 배치됐다. 수비에는 심상민, 진시우, 변준수, 조성권이 출전했으며 김경민이 골문을 지켰다. 교체명단에는 노희동, 안영규, 이강현, 최경록, 김진호, 권성윤, 민상기, 오후성, 문민서가 이름을 올렸다. 전북은 4-3-3으로 김정훈, 박진섭, 김태환, 홍정호, 김태현, 연제운, 강상윤, 김진규, 이동준, 티아고, 송민규가 출격했다. 단판으로 진행되는 결승전인 만큼 양팀 모두 한치의 양보 없이 치열한 경기가 이어졌다. 전반 28분 신창무가 오른쪽에서 크로스를 시도했지만 아쉽게 연결되지 못하며 공격 기회가 무산됐다. 팽팽한 경기가 진행되던 중 승부는 더 알 수 없게 됐다. 전반 40분 광주의 이정효 감독이 퇴장당하며 양팀 모두 감독 없이 경기를 치르게 됐다. 결국 전북의 공세를 버티지 못했다. 전반 47분 진시우와 김경민의 동선이 겹치며 이동준에게 선제골을 허용해 0-1이 됐다. 광주는 후반 시작과 동시에 주세종을 불러들이고 이강현을 투입해 반전을 기대했다. 하지만 오히려 악재가 찾아왔다. 후반 5분 골키퍼 김경민이 부상으로 노희동과 교체됐다. 전북의 공세는 더 거세졌다. 후반 15분 김태현의 슛이 이어졌지만, 다행히 노희동이 막았다. 포기하지 않고 기회를 노린 광주는 동점골에 성공했다. 후반 24분 신창무가 올린 크로스를 헤이스가 프리드욘슨에게 연결, 그대로 전북의 골망을 갈라 1-1 동점이 됐다. 기세를 탄 광주는 더욱 공격적으로 나왔다. 후반 38분 박인혁이 전북의 골문 앞으로 크로스를 올렸지만 아쉽게 동료에게 전달되지 못했다. 치열한 승부는 정규시간만에 않았고 결국 연장전에 돌입했다. 6일 서울월드컵경기장에서 열린 전북현대와의 하나은행 코리아컵 결승전에서 치열한 응원전을 펼치는 광주FC 팬들. 광주FC 제공 연장전에서 광주에게 또 한번의 악재가 겹쳤다. 연장 전반 6분 조성권이 이승우와 충돌한 뒤 어깨로 가격해 퇴장을 당 수적 열세에 놓이게 됐다. 결국 연장 전반 15분 이승우에게 골을 내주며 1-2가 됐다. 연장 후반 2분 권성윤이 전북의 이승우에게 머리를 강하게 맞으며 전북도 퇴장을 당해 다시 한번 경기가 미궁으로 빠져들었다. 하지만 광주는 추가득점에 실패하며 결국 경기는 1-2로 종료됐다. 마철준 광주FC 수석코치는 경기 후 기자회견에서 &quot;추운 날씨 속에서 응원해준 팬들에게 감사하다. 우리 선수들, 코치들 모두 한 해 고생많았다&quot;며 &quot;&#39;경
```


# 다른 본문 관련 패턴 검색


# "광주FC가" 키워드 위치: 554
```html
="preload" as="image" href="https://cdn.jnilbo.com/news/photo/202512/90000015817_516043_2923.jpg" />
<meta name="title" content="광주FC, 퇴장 악재속 코리아컵 준우승 - 전남일보"/>
<meta name="description" content="프로축구 광주FC가 창단 첫 코리아컵 우승을 노렸지만 아쉽게 준우승에 그쳤다.광주는 6일 1시 30분 서울월드컵경기장에서 열린 하나은행 코리아컵 결승전에서 전북 "/>
<meta name="Classification" content="스포츠와 건강"/>
<meta name="Copyright" content="전남일보"/>
<meta name="author" content="서울=이정준 기자"/>
<meta name="referrer" content="no-referrer-when-downgrade" />
<meta property="og:site_name" content="전남일보"/>
<meta property="og:image" content="https://cdn.jnilbo.com/news/photo/202512/90000015817_516043_2923.jpg" />
<meta property="og:type" content="article" />
<meta property="og
```