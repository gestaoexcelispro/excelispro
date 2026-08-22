import {
  StyleSheet,
} from '@react-pdf/renderer';

const colors = {
  navy: '#061B2F',
  navySoft: '#0B2945',

  teal: '#087F73',
  tealStrong: '#08AA96',
  tealSoft: '#EFFCF9',

  slate900: '#0F172A',
  slate800: '#1E293B',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',

  white: '#FFFFFF',

  amber: '#9A6700',
  amberSoft: '#FFFBEB',

  red: '#9F2929',
  redSoft: '#FFF5F5',

  blue: '#0B5FA5',
  blueSoft: '#EFF6FF',
};

export const pdfColors =
  colors;

export const pdfStyles =
  StyleSheet.create({
    page: {
      position: 'relative',
      paddingTop: 34,
      paddingRight: 34,
      paddingBottom: 44,
      paddingLeft: 34,

      backgroundColor:
        colors.white,

      color:
        colors.slate700,

      fontFamily:
        'Helvetica',

      fontSize:
        8.5,

      lineHeight:
        1.4,
    },

    pageContent: {
      flexDirection:
        'column',
    },

    topAccent: {
      position:
        'absolute',

      top: 0,
      left: 0,
      right: 0,

      height: 4,

      backgroundColor:
        colors.tealStrong,
    },

    header: {
      marginBottom:
        14,

      paddingBottom:
        12,

      borderBottomWidth:
        1,

      borderBottomColor:
        colors.slate200,

      borderBottomStyle:
        'solid',
    },

    headerTopRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      marginBottom:
        10,
    },

    brandBlock: {
      flexDirection:
        'column',
    },

    brandName: {
      color:
        colors.teal,

      fontSize:
        16,

      fontWeight:
        700,

      letterSpacing:
        0.2,
    },

    brandSubtitle: {
      marginTop:
        2,

      color:
        colors.slate500,

      fontSize:
        6.5,

      textTransform:
        'uppercase',

      letterSpacing:
        0.8,
    },

    documentBadge: {
      minWidth:
        92,

      paddingTop:
        6,

      paddingRight:
        10,

      paddingBottom:
        6,

      paddingLeft:
        10,

      borderRadius:
        4,

      backgroundColor:
        colors.navy,

      color:
        colors.white,

      fontSize:
        7,

      fontWeight:
        700,

      textAlign:
        'center',

      textTransform:
        'uppercase',

      letterSpacing:
        0.8,
    },

    titleRow: {
      flexDirection:
        'row',

      alignItems:
        'flex-end',

      justifyContent:
        'space-between',

      gap: 14,
    },

    titleBlock: {
      flexGrow: 1,
      flexShrink: 1,
    },

    reportTitle: {
      color:
        colors.navy,

      fontSize:
        18,

      fontWeight:
        700,

      lineHeight:
        1.15,
    },

    reportSubtitle: {
      marginTop:
        4,

      color:
        colors.slate500,

      fontSize:
        7.5,

      lineHeight:
        1.45,
    },

    statusBadge: {
      minWidth:
        72,

      paddingTop:
        5,

      paddingRight:
        9,

      paddingBottom:
        5,

      paddingLeft:
        9,

      borderRadius:
        20,

      fontSize:
        7,

      fontWeight:
        700,

      textAlign:
        'center',

      textTransform:
        'uppercase',
    },

    statusDraft: {
      backgroundColor:
        colors.slate100,

      color:
        colors.slate600,
    },

    statusSubmitted: {
      backgroundColor:
        colors.blueSoft,

      color:
        colors.blue,
    },

    statusReviewed: {
      backgroundColor:
        colors.amberSoft,

      color:
        colors.amber,
    },

    statusApproved: {
      backgroundColor:
        colors.tealSoft,

      color:
        colors.teal,
    },

    draftWatermark: {
      position:
        'absolute',

      top:
        '42%',

      left:
        70,

      right:
        70,

      color:
        '#E8EDF2',

      fontSize:
        56,

      fontWeight:
        700,

      textAlign:
        'center',

      transform:
        'rotate(-35deg)',

      opacity:
        0.45,
    },

    summaryGrid: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      marginTop:
        6,

      marginRight:
        -5,

      marginBottom:
        8,

      marginLeft:
        -5,
    },

    summaryCard: {
      width:
        '25%',

      paddingRight:
        5,

      paddingLeft:
        5,

      marginBottom:
        10,
    },

    summaryCardInner: {
      minHeight:
        50,

      paddingTop:
        9,

      paddingRight:
        10,

      paddingBottom:
        8,

      paddingLeft:
        10,

      borderWidth:
        1,

      borderColor:
        colors.slate200,

      borderStyle:
        'solid',

      borderRadius:
        5,

      backgroundColor:
        colors.slate50,
    },

    summaryCardSuccess: {
      backgroundColor:
        colors.tealSoft,

      borderColor:
        '#CDEFE9',
    },

    summaryCardWarning: {
      backgroundColor:
        colors.amberSoft,

      borderColor:
        '#FDE68A',
    },

    summaryCardDanger: {
      backgroundColor:
        colors.redSoft,

      borderColor:
        '#FECACA',
    },

    summaryLabel: {
      color:
        colors.slate500,

      fontSize:
        5.8,

      fontWeight:
        700,

      textTransform:
        'uppercase',

      letterSpacing:
        0.45,
    },

    summaryValue: {
      marginTop:
        5,

      color:
        colors.navy,

      fontSize:
        13,

      fontWeight:
        700,
    },

    summaryValueSuccess: {
      color:
        colors.teal,
    },

    summaryValueWarning: {
      color:
        colors.amber,
    },

    summaryValueDanger: {
      color:
        colors.red,
    },

    summaryHelper: {
      marginTop:
        3,

      color:
        colors.slate500,

      fontSize:
        5.8,

      lineHeight:
        1.3,
    },

    section: {
      marginTop:
        12,
    },

    sectionKeepTogether: {
      marginTop:
        12,
    },

    sectionHeader: {
      marginBottom:
        8,

      paddingBottom:
        5,

      borderBottomWidth:
        1,

      borderBottomColor:
        colors.slate200,

      borderBottomStyle:
        'solid',
    },

    sectionEyebrow: {
      color:
        colors.teal,

      fontSize:
        6.2,

      fontWeight:
        700,

      textTransform:
        'uppercase',

      letterSpacing:
        0.65,
    },

    sectionTitle: {
      marginTop:
        2,

      color:
        colors.navy,

      fontSize:
        11,

      fontWeight:
        700,

      lineHeight:
        1.2,
    },

    sectionDescription: {
      marginTop:
        3,

      color:
        colors.slate500,

      fontSize:
        6.8,

      lineHeight:
        1.45,
    },

    infoGrid: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      marginRight:
        -4,

      marginLeft:
        -4,
    },

    infoCellHalf: {
      width:
        '50%',

      paddingRight:
        4,

      paddingLeft:
        4,

      marginBottom:
        8,
    },

    infoCellThird: {
      width:
        '33.333%',

      paddingRight:
        4,

      paddingLeft:
        4,

      marginBottom:
        8,
    },

    infoCellQuarter: {
      width:
        '25%',

      paddingRight:
        4,

      paddingLeft:
        4,

      marginBottom:
        8,
    },

    infoBox: {
      minHeight:
        42,

      paddingTop:
        7,

      paddingRight:
        8,

      paddingBottom:
        7,

      paddingLeft:
        8,

      borderWidth:
        1,

      borderColor:
        colors.slate200,

      borderStyle:
        'solid',

      borderRadius:
        4,

      backgroundColor:
        colors.white,
    },

    infoLabel: {
      color:
        colors.slate500,

      fontSize:
        5.7,

      fontWeight:
        700,

      textTransform:
        'uppercase',

      letterSpacing:
        0.35,
    },

    infoValue: {
      marginTop:
        4,

      color:
        colors.navy,

      fontSize:
        7.5,

      fontWeight:
        700,

      lineHeight:
        1.35,
    },

    textBox: {
      paddingTop:
        8,

      paddingRight:
        9,

      paddingBottom:
        8,

      paddingLeft:
        9,

      borderWidth:
        1,

      borderColor:
        colors.slate200,

      borderStyle:
        'solid',

      borderRadius:
        4,

      backgroundColor:
        colors.slate50,
    },

    textBoxTitle: {
      color:
        colors.slate500,

      fontSize:
        5.8,

      fontWeight:
        700,

      textTransform:
        'uppercase',

      letterSpacing:
        0.35,
    },

    textBoxContent: {
      marginTop:
        5,

      color:
        colors.slate700,

      fontSize:
        7.2,

      lineHeight:
        1.45,
    },

    table: {
      width:
        '100%',

      borderWidth:
        1,

      borderColor:
        colors.slate200,

      borderStyle:
        'solid',

      borderRadius:
        4,
    },

    tableHeader: {
      flexDirection:
        'row',

      backgroundColor:
        colors.navy,
    },

    tableHeaderCell: {
      paddingTop:
        5,

      paddingRight:
        5,

      paddingBottom:
        5,

      paddingLeft:
        5,

      color:
        colors.white,

      fontSize:
        5.6,

      fontWeight:
        700,

      textTransform:
        'uppercase',

      lineHeight:
        1.25,
    },

    tableRow: {
      flexDirection:
        'row',

      borderTopWidth:
        1,

      borderTopColor:
        colors.slate200,

      borderTopStyle:
        'solid',

      backgroundColor:
        colors.white,
    },

    tableRowAlternate: {
      backgroundColor:
        colors.slate50,
    },

    tableCell: {
      paddingTop:
        5,

      paddingRight:
        5,

      paddingBottom:
        5,

      paddingLeft:
        5,

      color:
        colors.slate700,

      fontSize:
        6.1,

      lineHeight:
        1.35,
    },

    tableCellStrong: {
      color:
        colors.navy,

      fontWeight:
        700,
    },

    tableCellSuccess: {
      color:
        colors.teal,

      fontWeight:
        700,
    },

    tableCellWarning: {
      color:
        colors.amber,

      fontWeight:
        700,
    },

    tableCellDanger: {
      color:
        colors.red,

      fontWeight:
        700,
    },

    divider: {
      height:
        1,

      marginTop:
        8,

      marginBottom:
        8,

      backgroundColor:
        colors.slate200,
    },

    badge: {
      alignSelf:
        'flex-start',

      paddingTop:
        3,

      paddingRight:
        6,

      paddingBottom:
        3,

      paddingLeft:
        6,

      borderRadius:
        10,

      fontSize:
        5.5,

      fontWeight:
        700,
    },

    badgeNeutral: {
      backgroundColor:
        colors.slate100,

      color:
        colors.slate600,
    },

    badgeSuccess: {
      backgroundColor:
        colors.tealSoft,

      color:
        colors.teal,
    },

    badgeWarning: {
      backgroundColor:
        colors.amberSoft,

      color:
        colors.amber,
    },

    badgeDanger: {
      backgroundColor:
        colors.redSoft,

      color:
        colors.red,
    },

    progressTrack: {
      height:
        5,

      overflow:
        'hidden',

      borderRadius:
        20,

      backgroundColor:
        colors.slate200,
    },

    progressFill: {
      height:
        '100%',

      borderRadius:
        20,

      backgroundColor:
        colors.tealStrong,
    },

    photoGrid: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      marginTop:
        6,

      marginRight:
        -5,

      marginLeft:
        -5,
    },

    photoColumn: {
      width:
        '50%',

      paddingRight:
        5,

      paddingLeft:
        5,

      marginBottom:
        12,
    },

    photoCard: {
      overflow:
        'hidden',

      borderWidth:
        1,

      borderColor:
        colors.slate200,

      borderStyle:
        'solid',

      borderRadius:
        5,

      backgroundColor:
        colors.white,
    },

    photoImageWrapper: {
      width:
        '100%',

      height:
        175,

      alignItems:
        'center',

      justifyContent:
        'center',

      overflow:
        'hidden',

      backgroundColor:
        colors.slate100,
    },

    photoImage: {
      width:
        '100%',

      height:
        '100%',

      objectFit:
        'cover',
    },

    photoBody: {
      paddingTop:
        8,

      paddingRight:
        8,

      paddingBottom:
        8,

      paddingLeft:
        8,
    },

    photoIndex: {
      color:
        colors.teal,

      fontSize:
        5.7,

      fontWeight:
        700,

      textTransform:
        'uppercase',

      letterSpacing:
        0.45,
    },

    photoTitle: {
      marginTop:
        3,

      color:
        colors.navy,

      fontSize:
        7.5,

      fontWeight:
        700,

      lineHeight:
        1.3,
    },

    photoMeta: {
      marginTop:
        4,

      color:
        colors.slate500,

      fontSize:
        5.8,

      lineHeight:
        1.35,
    },

    photoDescription: {
      marginTop:
        5,

      color:
        colors.slate700,

      fontSize:
        6.2,

      lineHeight:
        1.4,
    },

    attachmentList: {
      marginTop:
        8,
    },

    attachmentRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      gap:
        10,

      paddingTop:
        7,

      paddingRight:
        8,

      paddingBottom:
        7,

      paddingLeft:
        8,

      borderBottomWidth:
        1,

      borderBottomColor:
        colors.slate200,

      borderBottomStyle:
        'solid',
    },

    attachmentName: {
      flexGrow: 1,
      flexShrink: 1,

      color:
        colors.navy,

      fontSize:
        6.5,

      fontWeight:
        700,
    },

    attachmentMeta: {
      color:
        colors.slate500,

      fontSize:
        5.7,
    },

    approvalCard: {
      marginBottom:
        8,

      paddingTop:
        9,

      paddingRight:
        10,

      paddingBottom:
        9,

      paddingLeft:
        10,

      borderWidth:
        1,

      borderColor:
        colors.slate200,

      borderStyle:
        'solid',

      borderRadius:
        4,

      backgroundColor:
        colors.slate50,
    },

    approvalAction: {
      color:
        colors.teal,

      fontSize:
        6,

      fontWeight:
        700,

      textTransform:
        'uppercase',

      letterSpacing:
        0.4,
    },

    approvalPerson: {
      marginTop:
        4,

      color:
        colors.navy,

      fontSize:
        7.3,

      fontWeight:
        700,
    },

    approvalDate: {
      marginTop:
        2,

      color:
        colors.slate500,

      fontSize:
        5.8,
    },

    approvalComment: {
      marginTop:
        5,

      color:
        colors.slate700,

      fontSize:
        6.2,

      lineHeight:
        1.4,
    },

    emptyState: {
      paddingTop:
        16,

      paddingRight:
        12,

      paddingBottom:
        16,

      paddingLeft:
        12,

      borderWidth:
        1,

      borderColor:
        colors.slate200,

      borderStyle:
        'solid',

      borderRadius:
        4,

      backgroundColor:
        colors.slate50,

      textAlign:
        'center',
    },

    emptyStateTitle: {
      color:
        colors.navy,

      fontSize:
        7.5,

      fontWeight:
        700,
    },

    emptyStateText: {
      marginTop:
        4,

      color:
        colors.slate500,

      fontSize:
        6.2,

      lineHeight:
        1.4,
    },

    footer: {
      position:
        'absolute',

      left: 34,
      right: 34,
      bottom: 18,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      paddingTop:
        6,

      borderTopWidth:
        1,

      borderTopColor:
        colors.slate200,

      borderTopStyle:
        'solid',
    },

    footerText: {
      color:
        colors.slate500,

      fontSize:
        5.7,
    },

    footerPage: {
      color:
        colors.slate500,

      fontSize:
        5.7,

      textAlign:
        'right',
    },

    pageBreakBefore: {
      breakBefore:
        'page',
    },

    noBreak: {
      breakInside:
        'avoid',
    },
  });
