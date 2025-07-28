// To add more reward types, simply add them to this array.
// The form dropdowns will update automatically.
export const REWARD_TYPES = [
    "DIAMOND",
    "GOLD",
    "STAR",
    "MONSTER",
    "RESET_STONE",
    "ARTIFACT",
    "GOLD_LEVEL",
    "NORMAL_FUSION_BOTTLE",
    "RARE_FUSION_BOTTLE",
    "NORMAL_EGG",
    "RARE_EGG",
    "ELEMENTAL_EGG",
    "LEGEND_EGG",
    "STAR_FUSION_EVENT",
    "DICE",
    "REMOVE_ADS",
    "GALAXY_EGG",
    "STAR_GALAXY_EVENT",
    "CHRISTMAS_TICKET",
    "CHRISTMAS_BELL",
    "MUTANT_BOTTLE",
    "HAMMER",
    "CHRISTMAS_7Days_X2",
    "CHRISTMAS_7Days_X4",
    "VIP_PACK",
    "CHALLENGE_TICKET",
    "FISH_BAIT",
    "AVIATOR_STONE",
    "CHALLENGE_STONE",
    "PURCHASE_PACK",
    "PVP_TICKET",
    "PVP_RANK_POINT",
    "RACE_TICKET_RANDOM",
    "RACE_TICKET_1_STAR",
    "RACE_TICKET_2_STAR",
    "RACE_TICKET_3_STAR",
    "RACE_TICKET_4_STAR",
    "RACE_TICKET_5_STAR",
    "RACE_TICKET_6_STAR",
    "DIAMOND_PACK_EVERYDAY",
    "UNLOCK_ALL_FARMS",
    "SPEED_UP_COMBAT",
    "TIME_SKIP_FREE",
    "UNLIMITED_AUTO_FUSION",
    "EXPLORE_SKIP_FREE",
    "AVATAR_INFO_PLAYER",
    "FRAME_AVATAR_INFO_PLAYER",
    "LUNARIS_BLOOM",
    "DIVINE_SPIRIT",
    "JIGSAW_SUPREME_FRAG",
    "JIGSAW_DIVINE_FRAG",
    "JIGSAW_LEGENG_FRAG",
    "THUNDER_EGG",
    "SOLO_BATTLE_TICKET",
] as const;

export const ARTIFACT_RARITIES = [
    "None",
    "NORMAL",
    "UNCOMMON",
    "RARE",
    "EPIC",
    "LEGEND",
    "DIVINE",
    "SUPREME",
] as const;

export const ARTIFACT_PIECE_TYPES = [
    "None",
    "WolfClaw", "WolfFang", "WolfEye", "Wolf_FullSet",
    "LionClaw", "LionHeart", "LionTail", "Lion_FullSet",
    "WildBoarTusk", "WildBoarFeet", "WildBoarTail", "WildBoar_FullSet",
    "BeeWing", "BeeTail", "BeeEye", "Bee_FullSet",
    "SharkFin", "SharkJaw", "SharkTail", "Shark_FullSet",
    "UnicornHorn", "UnicornClaw", "UnicornTail", "Unicorn_FullSet",
    "DragonScale", "DragonHorn", "DragonClaw", "Dragon_FullSet",
] as const;

type ArtifactPieceType = typeof ARTIFACT_PIECE_TYPES[number];

const PIECE_TYPE_TO_CLASS_CHAR: Record<ArtifactPieceType, string> = {
    None: "A",
    WolfClaw: "A", WolfFang: "A", WolfEye: "A", Wolf_FullSet: "A",
    LionClaw: "B", LionHeart: "B", LionTail: "B", Lion_FullSet: "B",
    WildBoarTusk: "C", WildBoarFeet: "C", WildBoarTail: "C", WildBoar_FullSet: "C",
    BeeWing: "D", BeeTail: "D", BeeEye: "D", Bee_FullSet: "D",
    SharkFin: "E", SharkJaw: "E", SharkTail: "E", Shark_FullSet: "E",
    UnicornHorn: "F", UnicornClaw: "F", UnicornTail: "F", Unicorn_FullSet: "F",
    DragonScale: "G", DragonHorn: "G", DragonClaw: "G", Dragon_FullSet: "G",
};

export function getClassCharForPieceType(pieceType: ArtifactPieceType): string {
    return PIECE_TYPE_TO_CLASS_CHAR[pieceType] || "A";
}
