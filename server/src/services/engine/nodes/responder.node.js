import { toTR } from '../categoryMap.js';

const END_BUTTONS = [
  {
    id: "end_analyze",
    label: "Analiz Et",
    payload: { action: "start_analysis" },
  },
  {
    id: "end_transaction",
    label: "İşlem Ekle",
    payload: { action: "start_transaction" },
  },
  { id: "end_goal", label: "Hedef Oluştur", payload: { action: "start_goal" } },
  { id: "end_done", label: "Hayır, teşekkürler", payload: { action: "done" } },
];

function getCategoryTips(category) {
  const c = (category ?? "").toLowerCase();
  if (/yemek|restoran|kafe|cafe|coffee|food|sipariş/.test(c))
    return "Öğle yemeğini evden götür ve haftada 2 gün dışarıda yemekten vazgeç — aylık %30-40 tasarruf sağlayabilirsin. Yemek siparişi yerine market alışverişini tercih et.";
  if (/market|bakkal|alışveriş|grocery|süpermarket/.test(c))
    return "Alışverişe liste yaparak git ve açken gitme. İndirimli günleri (pazar sabahı) takip et. Marka ürünler yerine zincir market markalarını dene.";
  if (/ulaşım|taksi|otobüs|metro|transport|yakıt|benzin/.test(c))
    return "Toplu taşıma aboneliği al, bireysel seyahat yerine karpool tercih et. Kısa mesafelerde yürü ya da bisiklet kullan.";
  if (/eğlence|sinema|oyun|entertainment|müzik|netflix|dizi/.test(c))
    return "Abonelikleri gözden geçir ve kullanmadıklarını iptal et. Ücretsiz etkinlikleri (park, sergi, kütüphane) değerlendir. Abonelikleri arkadaşlarla paylaş.";
  if (/giyim|kıyafet|moda|clothing|ayakkabı/.test(c))
    return "Sezon sonu indirimlerini bekle ve alışverişi planlı yap. İkinci el platformlarını dene. Her ay giyim için sabit bütçe belirle.";
  if (/fatura|kira|elektrik|su|internet|bill|doğalgaz/.test(c))
    return "Elektrik tasarrufu için LED ampul kullan, gereksiz cihazları fişten çek. İnternet ve telefon tarifelerini karşılaştır, daha uygun paketlere geç.";
  if (/sağlık|spor|health|ilaç|eczane/.test(c))
    return "Reçeteli ilaçlarda jenerik alternatifleri sor. Spor için açık alan ve ücretsiz antrenmanları değerlendir. Düzenli check-up ile ilerideki masrafları önle.";
  if (/kafe|kahve|çay|starbucks/.test(c))
    return "Kahveyi evde hazırlayarak haftada birkaç kez kafe ziyaretini azalt. Termos kullan, ofiste veya dışarıda kendi kahveni götür.";
  return `${category} için aylık harcama limiti belirle ve her hafta kontrol et. Zorunlu olmayan harcamaları 24 saat bekletme kuralıyla filtrele — gerçekten ihtiyacın var mı diye sor.`;
}

export const responderNode = async (state) => {
  const {
    classification,
    pendingData,
    warning,
    wastefulCategories,
    detectedSavings,
    optimizedRoute,
    buttonPayload,
    message,
    activeGoals,
  } = state;

  if (classification === "CHITCHAT") {
    return {
      message:
        "Merhaba! Harcamalarını analiz etmemi, işlem kaydetmemi veya hedeflerini kontrol etmemi ister misin?",
      buttons: [
        {
          id: "ch_analyze",
          label: "Harcamaları Analiz Et",
          payload: { action: "start_analysis" },
        },
        {
          id: "ch_goals",
          label: "Hedeflerim",
          payload: { action: "start_goal" },
        },
        {
          id: "ch_tx",
          label: "İşlem Ekle",
          payload: { action: "start_transaction" },
        },
      ],
    };
  }

  if (buttonPayload?.action === "start_goal") {
    return {
      message:
        'Yeni bir hedef oluşturmak için hedefinin adını ve tutarını yaz.\n(Örn: "Tatil için 15.000 TL biriktirmek istiyorum")',
      buttons: [
        {
          id: "start_goal_cancel",
          label: "İptal",
          payload: { action: "cancel" },
        },
      ],
    };
  }

  if (buttonPayload?.action === "start_transaction") {
    return {
      message:
        'Hangi işlemi eklemek istediğini yaz.\n(Örn: "Markete 250 TL harcadım" veya "Maaşım 15.000 TL yattı")',
      buttons: [
        {
          id: "start_tx_cancel",
          label: "İptal",
          payload: { action: "cancel" },
        },
      ],
    };
  }

  if (classification === "GOAL_STATUS") {
    if (!activeGoals?.length) {
      return {
        message:
          "Henüz aktif hedefin yok. Mindy ile yeni bir hedef oluşturabilirsin!",
        buttons: [
          {
            id: "gs_create",
            label: "Hedef Oluştur",
            payload: { action: "start_goal" },
          },
        ],
      };
    }
    const lines = activeGoals.map((g) => {
      const remaining = Math.max(
        0,
        Number(g.target_amount) - Number(g.current_amount),
      );
      const pct = Number(g.progress_pct).toFixed(0);
      return `• ${g.title}: %${pct} tamamlandı — ${Number(remaining).toLocaleString("tr-TR")} TL kaldı`;
    });
    return {
      message: `Hedeflerinin durumu:\n\n${lines.join("\n")}`,
      buttons: END_BUTTONS,
    };
  }

  if (classification === "TRANSACTION") {
    if (!pendingData || pendingData.type !== "transaction")
      return {
        message: message || "İşlem detayları anlaşılamadı. Lütfen tekrar dene.",
        buttons: END_BUTTONS,
      };

    const { amount, transactionType, category, description } = pendingData;
    const typeLabel = transactionType === "INCOME" ? "gelir" : "gider";

    let msg = warning
      ? `${warning}\n\n${amount.toLocaleString("tr-TR")} TL tutarındaki ${category} ${typeLabel}ini yine de kaydedeyim mi?`
      : `${amount.toLocaleString("tr-TR")} TL tutarındaki ${category} ${typeLabel}ini kaydedeyim mi?`;

    if (description && description !== state.currentInput)
      msg += ` (${description})`;

    return {
      message: msg,
      buttons: [
        {
          id: "confirm_yes",
          label: "Evet, kaydet",
          payload: { action: "confirm_transaction", transaction: pendingData },
        },
        { id: "confirm_no", label: "İptal", payload: { action: "cancel" } },
      ],
    };
  }

  if (buttonPayload?.action === "set_deadline") {
    const goalData =
      buttonPayload.pendingGoalData ??
      (pendingData?.type === "goal" ? pendingData : null);

    if (!goalData)
      return {
        message: "Hedef verisi bulunamadı. Lütfen tekrar dene.",
        buttons: END_BUTTONS,
      };

    const months = buttonPayload.months;
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + months);
    const deadlineStr = deadline.toISOString().split("T")[0];
    const goalWithDeadline = { ...goalData, deadline: deadlineStr };

    return {
      message: `${goalData.target_amount.toLocaleString("tr-TR")} TL hedef, ${months} aylık süre (${deadlineStr}). Oluşturayım mı?`,
      buttons: [
        {
          id: "goal_confirm",
          label: "Evet, oluştur",
          payload: { action: "confirm_goal", goal: goalWithDeadline },
        },
        { id: "goal_cancel", label: "İptal", payload: { action: "cancel" } },
      ],
    };
  }

  if (classification === "GOAL_CREATION") {
    if (!pendingData || pendingData.type !== "goal")
      return {
        message: message || "Hedef detayları anlaşılamadı. Lütfen tekrar dene.",
        buttons: END_BUTTONS,
      };

    return {
      message: `${pendingData.title} için ${pendingData.target_amount.toLocaleString("tr-TR")} TL hedef belirliyoruz. Ne kadar sürede biriktirmek istersin?`,
      buttons: [
        {
          id: "dl_3m",
          label: "3 ay",
          payload: {
            action: "set_deadline",
            months: 3,
            pendingGoalData: pendingData,
          },
        },
        {
          id: "dl_6m",
          label: "6 ay",
          payload: {
            action: "set_deadline",
            months: 6,
            pendingGoalData: pendingData,
          },
        },
        {
          id: "dl_1y",
          label: "1 yıl",
          payload: {
            action: "set_deadline",
            months: 12,
            pendingGoalData: pendingData,
          },
        },
        {
          id: "dl_2y",
          label: "2 yıl",
          payload: {
            action: "set_deadline",
            months: 24,
            pendingGoalData: pendingData,
          },
        },
      ],
    };
  }

  if (buttonPayload?.action === "reduce_category") {
    const cat = buttonPayload.category;
    const hasGoals = activeGoals?.length > 0;

    return {
      message: `${cat} harcamalarını azaltmak için ne yapmak istersin?`,
      buttons: [
        {
          id: "tip_budget",
          label: "İpuçları ver",
          payload: { action: "get_tips", category: cat },
        },
        ...(hasGoals
          ? [
              {
                id: "tip_route",
                label: "Hedefe yönlendir",
                payload: {
                  action: "route_savings",
                  category: cat,
                  amount: buttonPayload.amount,
                },
              },
            ]
          : []),
        {
          id: "tip_back",
          label: "Geri dön",
          payload: { action: "back_to_analysis" },
        },
      ],
    };
  }

  if (buttonPayload?.action === "get_tips") {
    const cat = buttonPayload.category ?? "";
    return {
      message: `${cat} harcamalarını azaltmak için ipuçları:\n\n${getCategoryTips(cat)}`,
      buttons: END_BUTTONS,
    };
  }

  if (buttonPayload?.action === "route_savings") {
    const amount = buttonPayload?.amount ?? detectedSavings ?? 0;

    if (activeGoals?.length > 1) {
      return {
        message: `${amount > 0 ? `${Number(amount).toLocaleString("tr-TR")} TL tasarrufunu` : "Tasarrufunu"} hangi hedefe yönlendirmek istersin?`,
        buttons: [
          ...activeGoals.slice(0, 3).map((g, i) => ({
            id: `route_goal_${i}`,
            label: g.title,
            payload: {
              action: "confirm_routing",
              route: { goalId: g.id, goalTitle: g.title, amount },
            },
          })),
          { id: "route_cancel", label: "Sonra", payload: { action: "cancel" } },
        ],
      };
    }

    const targetGoal = activeGoals?.[0];
    const route =
      optimizedRoute ??
      (targetGoal
        ? {
            goalId: targetGoal.id,
            goalTitle: targetGoal.title,
            amount,
          }
        : null);

    const goalTitle = route?.goalTitle ?? "hedefinize";

    return {
      message: `${amount > 0 ? `${Number(amount).toLocaleString("tr-TR")} TL` : "Tasarruf"} ${goalTitle} hedefine yönlendirilsin mi?`,
      buttons: [
        {
          id: "route_yes",
          label: "Evet, yönlendir",
          payload: { action: "confirm_routing", route },
        },
        { id: "route_no", label: "Sonra", payload: { action: "cancel" } },
      ],
    };
  }

  if (
    buttonPayload?.action === "back_to_analysis" ||
    buttonPayload?.action === "start_analysis"
  ) {
    const catButtons = (wastefulCategories ?? []).slice(0, 3).map((c, i) => ({
      id: `cat_${i}`,
      label: `${toTR(c.name)} — ${Number(c.amount).toLocaleString("tr-TR")} TL`,
      payload: {
        action: "reduce_category",
        category: c.name,
        amount: c.amount,
      },
    }));
    return {
      message: message || "Hangi kategoriyi azaltmak istersin?",
      buttons: catButtons.length ? catButtons : END_BUTTONS,
    };
  }

  const catButtons = (wastefulCategories ?? []).slice(0, 3).map((c, i) => ({
    id: `cat_${i}`,
    label: `${toTR(c.name)} — ${Number(c.amount).toLocaleString("tr-TR")} TL`,
    payload: { action: "reduce_category", category: c.name, amount: c.amount },
  }));

  const hasGoals = activeGoals?.length > 0;
  const hasSavings = detectedSavings > 0;
  const currentInput = state.currentInput ?? "";

  // "Tasarruf önerileri ver" → savings-focused buttons
  if (/tasarruf/i.test(currentInput)) {
    const buttons = [];
    if (hasGoals && hasSavings)
      buttons.push({
        id: "route_savings_main",
        label: `${Number(detectedSavings).toLocaleString("tr-TR")} TL → Hedefe Yönlendir`,
        payload: { action: "route_savings", amount: detectedSavings },
      });
    if (catButtons[0]) buttons.push(catButtons[0]);
    if (catButtons[1]) buttons.push(catButtons[1]);
    return { message, buttons: buttons.length ? buttons : END_BUTTONS };
  }

  // "Bu ay nasıl gidiyorum?" → monthly status buttons
  if (/nasıl gidiy|bu ay/i.test(currentInput)) {
    const buttons = [...catButtons.slice(0, 2)];
    if (hasGoals && hasSavings)
      buttons.push({
        id: "route_savings_status",
        label: `Tasarrufu Hedefe Yönlendir`,
        payload: { action: "route_savings", amount: detectedSavings },
      });
    else
      buttons.push({
        id: "status_end",
        label: "Tamam",
        payload: { action: "done" },
      });
    return { message, buttons: buttons.length ? buttons : END_BUTTONS };
  }

  // Default "Harcamalarımı analiz et" → all 3 category breakdown buttons
  if (catButtons.length > 0) return { message, buttons: catButtons };

  return {
    message: message || "Analizin hazır!",
    buttons: END_BUTTONS,
  };
};
