"""Original Galaxy S25 Ultra visualization, in meters, for the recording rig.

Only build_s25(scene) creates data. It never creates a scene, changes the active
scene, or saves/exports a file. X is width, Z height, rear cameras face -Y and
the display faces +Y. The parent can rotate the returned empty for landscape.

Published body dimensions: Samsung 162.8 x 77.6 x 8.2 mm (H x W x D).
Corner radii, ring dimensions and small component positions are visual estimates,
not factory CAD. References: outputs/referencias-ulanzi-s25/s25-ultra.md.
"""

import math
import bpy


def build_s25(scene):
    """Create the phone in scene and return the GalaxyS25Ultra root empty."""
    def material(name, rgb, metallic=0.0, roughness=0.4, emission=0.0):
        mat = bpy.data.materials.new('S25_' + name)
        mat.diffuse_color = (*rgb, 1.0)
        mat.use_nodes = True
        shader = mat.node_tree.nodes.get('Principled BSDF')
        shader.inputs['Base Color'].default_value = (*rgb, 1.0)
        shader.inputs['Metallic'].default_value = metallic
        shader.inputs['Roughness'].default_value = roughness
        if emission:
            shader.inputs['Emission Color'].default_value = (*rgb, 1.0)
            shader.inputs['Emission Strength'].default_value = emission
        return mat

    titanium = material('TitaniumSilverblue_Frame', (0.39, 0.435, 0.50), .78, .30)
    chamfer = material('PolishedTitanium', (0.59, 0.65, 0.73), .86, .22)
    back_mat = material('TitaniumSilverblue_Back', (0.46, 0.53, 0.65), .16, .43)
    black = material('BlackGaskets', (.006, .008, .011), .08, .51)
    ring_mat = material('CameraRing_Graphite', (.021, .026, .034), .66, .25)
    ring_edge = material('CameraRing_PolishedLip', (.095, .108, .135), .85, .20)
    cover = material('LensCover', (.005, .009, .014), .38, .13)
    optics = material('LensOptics', (.012, .038, .057), .61, .12)
    reflection = material('LensCoatingReflection', (.048, .14, .19), .52, .21)
    glass = material('FrontGlass', (.0025, .004, .007), .18, .20)
    antenna = material('AntennaPolymer', (.23, .27, .33), .03, .55)
    lettering = material('SubtleMarkings', (.19, .235, .30), .22, .43)
    flash = material('FlashDiffuser', (.79, .78, .64), .02, .35)
    flash_center = material('FlashPhosphor', (.72, .57, .26), .03, .42)
    screen_base = material('DisplayBackground', (.004, .008, .014), .05, .40, .12)
    screen_ribbon = material('DisplaySlateRibbon', (.020, .045, .072), .1, .47, .12)
    screen_lip = material('DisplaySilverRibbon', (.10, .16, .22), .1, .50, .10)
    screen_gold = material('DisplayWarmAccent', (.23, .16, .071), .1, .50, .08)
    screen_ui = material('DisplayGestureBar', (.30, .36, .42), .05, .45, .12)

    def empty(name, parent=None):
        obj = bpy.data.objects.new(name, None)
        scene.collection.objects.link(obj)
        obj.parent = parent
        obj.empty_display_size = .01
        return obj

    root = empty('GalaxyS25Ultra')
    shell_group = empty('S25_Body', root)
    back_group = empty('S25_Back', root)
    screen_group = empty('S25_Display', root)
    camera_group = empty('S25_RearCameras', root)
    control_group = empty('S25_ButtonsAndPorts', root)
    root['model'] = 'Samsung Galaxy S25 Ultra'
    root['units'] = 'meters'
    root['body_dimensions_mm_WHD'] = [77.6, 162.8, 8.2]
    root['body_dimensions_source'] = 'https://www.samsung.com/nz/smartphones/galaxy-s25-ultra/specs/'
    root['reference_dossier'] = 'outputs/referencias-ulanzi-s25/s25-ultra.md'
    root['chosen_finish'] = 'Titanium Silverblue, adjustable; real handset finish not confirmed'
    root['has_case'] = False
    root['estimated_corner_radius_mm'] = 4.8
    root['estimated_camera_protrusion_mm'] = 2.1
    root['estimated_main_camera_ring_diameter_mm'] = 15.8
    root['detail_fidelity'] = 'Original reference-based mesh; small dimensions are visual estimates, not official CAD'
    root['orientation'] = 'Portrait: X width, Z height; rear -Y, screen +Y. Front-view right is -X.'
    root['animation_note'] = 'Rigid handset; no unnecessary animation or internal simulation'

    def mesh_obj(name, verts, faces, mats, parent, smooth_faces=()):
        mesh = bpy.data.meshes.new(name + '_Mesh')
        mesh.from_pydata(verts, [], faces)
        mesh.update()
        obj = bpy.data.objects.new(name, mesh)
        scene.collection.objects.link(obj)
        obj.parent = parent
        for mat in mats:
            mesh.materials.append(mat)
        for idx in smooth_faces:
            mesh.polygons[idx].use_smooth = True
        return obj

    def outline(width, height, radius, steps=8):
        """CCW rounded rectangle in X/Z, independent of its shallow depth."""
        radius = min(radius, width / 2, height / 2)
        coords = []
        corners = [
            (width / 2 - radius, height / 2 - radius, 0),
            (-width / 2 + radius, height / 2 - radius, 90),
            (-width / 2 + radius, -height / 2 + radius, 180),
            (width / 2 - radius, -height / 2 + radius, 270),
        ]
        for cx, cz, degrees in corners:
            for j in range(steps + 1):
                angle = math.radians(degrees + 90 * j / steps)
                coords.append((cx + radius * math.cos(angle), cz + radius * math.sin(angle)))
        return coords

    def rr(name, width, height, radius, y_min, y_max, mat, parent,
           center=(0, 0, 0), shoulder=0.0, edge_mat=None, steps=8, opening=None):
        """Rounded-outline extrusion with optional explicit small edge shoulders."""
        if shoulder:
            profiles = [
                (y_min, width - 2 * shoulder, height - 2 * shoulder, max(radius - shoulder, .00002)),
                (y_min + shoulder, width, height, radius),
                (y_max - shoulder, width, height, radius),
                (y_max, width - 2 * shoulder, height - 2 * shoulder, max(radius - shoulder, .00002)),
            ]
        else:
            profiles = [(y_min, width, height, radius), (y_max, width, height, radius)]
        verts = []
        n = 4 * (steps + 1)
        for y, w, h, r in profiles:
            verts.extend((x, y, z) for x, z in outline(w, h, r, steps))
        if opening:
            inner_back = len(verts)
            verts.extend((x, y_min, z) for x, z in outline(*opening, steps))
            inner_front = len(verts)
            verts.extend((x, y_max, z) for x, z in outline(*opening, steps))
            faces = []
            outer_front = (len(profiles) - 1) * n
            for i in range(n):
                j = (i + 1) % n
                faces.append((i, j, inner_back + j, inner_back + i))
                faces.append((outer_front + j, outer_front + i, inner_front + i, inner_front + j))
                faces.append((inner_back + i, inner_back + j, inner_front + j, inner_front + i))
        else:
            faces = [tuple(range(n)), tuple(reversed(range((len(profiles) - 1) * n, len(profiles) * n)))]
        side_start = len(faces)
        for band in range(len(profiles) - 1):
            a, b = band * n, (band + 1) * n
            for i in range(n):
                j = (i + 1) % n
                faces.append((a + i, b + i, b + j, a + j))
        obj = mesh_obj(name, verts, faces, [mat] + ([edge_mat] if edge_mat else []), parent, range(side_start, len(faces)))
        obj.location = center
        if shoulder and edge_mat:
            for poly in obj.data.polygons[side_start:]:
                if (poly.index - side_start) // n in (0, 2):
                    poly.material_index = 1
        return obj

    def plane_rr(name, width, height, radius, y, mat, parent, center=(0, 0, 0), front=True, steps=8):
        verts = [(x, y, z) for x, z in outline(width, height, radius, steps)]
        face = tuple(reversed(range(len(verts)))) if front else tuple(range(len(verts)))
        obj = mesh_obj(name, verts, [face], [mat], parent)
        obj.location = center
        return obj

    def disc(name, x, z, y, radius, mat, parent, front=False, segments=40):
        verts = [(x + radius * math.cos(2 * math.pi * i / segments), y,
                  z + radius * math.sin(2 * math.pi * i / segments)) for i in range(segments)]
        face = tuple(reversed(range(segments))) if front else tuple(range(segments))
        return mesh_obj(name, verts, [face], [mat], parent)

    def lathe(name, x, z, profile, mat, parent, segments=48, edge_material=None, edge_bands=()):
        """Closed annular radial cross section, revolved around Y."""
        verts = []
        for r, y in profile:
            verts.extend((x + r * math.cos(2 * math.pi * i / segments), y,
                          z + r * math.sin(2 * math.pi * i / segments)) for i in range(segments))
        faces = []
        for band in range(len(profile)):
            a = band * segments
            b = ((band + 1) % len(profile)) * segments
            for i in range(segments):
                j = (i + 1) % segments
                faces.append((a + i, a + j, b + j, b + i))
        obj = mesh_obj(name, verts, faces, [mat] + ([edge_material] if edge_material else []), parent, range(len(faces)))
        if edge_material:
            for poly in obj.data.polygons:
                if poly.index // segments in edge_bands:
                    poly.material_index = 1
        return obj

    def arc(name, x, z, y, rx, rz, start, stop, width, mat, parent, front=False, steps=32):
        verts, faces = [], []
        for i in range(steps + 1):
            t = i / steps
            a = start + (stop - start) * t
            w = width * (.2 + .8 * math.sin(math.pi * t))
            for side in (-1, 1):
                verts.append((x + (rx + side * w / 2) * math.cos(a), y,
                              z + (rz + side * w / 2) * math.sin(a)))
        for i in range(steps):
            face = (2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2)
            faces.append(tuple(reversed(face)) if front else face)
        return mesh_obj(name, verts, faces, [mat], parent)

    def small_box(name, center, dimensions, mat, parent):
        x, y, z = (d / 2 for d in dimensions)
        verts = [(-x, -y, -z), (x, -y, -z), (x, y, -z), (-x, y, -z),
                 (-x, -y, z), (x, -y, z), (x, y, z), (-x, y, z)]
        faces = [(3, 2, 1, 0), (4, 5, 6, 7), (0, 1, 5, 4),
                 (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
        obj = mesh_obj(name, verts, faces, [mat], parent)
        obj.location = center
        return obj

    # Full-radius plan outline and small depth shoulders keep the phone thin and
    # flat. A generic bevelled cube cannot produce these independent radii.
    rr('S25_TitaniumUnibody', .0776, .1628, .0048, -.0041, .0041,
       titanium, shell_group, shoulder=.00022, edge_mat=chamfer, steps=10,
       opening=(.07582, .16102, .00411))
    rr('S25_RearGlassSeal', .0764, .1616, .0044, -.004085, -.00377,
       black, back_group, steps=10)
    rr('S25_SatinBackGlass', .0759, .1611, .00415, -.0041, -.00390,
       back_mat, back_group, shoulder=.00004, steps=10)
    rr('S25_FrontGlassSeal', .0766, .1618, .00435, .00380, .004075,
       black, screen_group, steps=10)
    plane_rr('S25_ContinuousFrontGlass', .0762, .1614, .00415, .00409,
             glass, screen_group, steps=10)
    plane_rr('S25_ActiveDisplay', .0731, .1583, .0037, .004105,
             screen_base, screen_group, steps=10)

    # Original, texture-free screen artwork. No copied vendor wallpaper or UI.
    arc('S25_DisplayFoldSlate', -.003, -.001, .004145, .024, .059,
        -.22 * math.pi, 1.48 * math.pi, .0068, screen_ribbon, screen_group, True, 52)
    arc('S25_DisplayFoldSilver', -.003, -.001, .004185, .0228, .0578,
        .02 * math.pi, 1.32 * math.pi, .0011, screen_lip, screen_group, True, 44)
    arc('S25_DisplayWarmEdge', -.003, -.001, .004185, .0271, .0621,
        .64 * math.pi, 1.23 * math.pi, .00055, screen_gold, screen_group, True, 28)
    plane_rr('S25_GestureBar', .020, .00062, .0003, .00415,
             screen_ui, screen_group, center=(0, 0, -.0755), steps=4)
    disc('S25_FrontCameraCutout', 0, .0759, .00415, .00145, black, screen_group, True, 32)
    disc('S25_FrontCameraOptic', 0, .0759, .00419, .00086, cover, screen_group, True, 24)
    disc('S25_FrontCameraGlint', -.00018, .0761, .00423, .00024, reflection, screen_group, True, 12)

    # Real arrangement: three prominent individual rings and one smaller camera.
    # The other small dark circle is Laser AF, not an invented fifth camera.
    camera_specs = [
        ('UltraWide', -.0230, .0610, .0079, .0035),
        ('MainWide', -.0230, .0396, .0079, .0042),
        ('Tele5x', -.0230, .0182, .0079, .00345),
        ('Tele3x', -.0042, .0396, .0050, .0028),
    ]
    for name, x, z, r, pupil in camera_specs:
        group = empty('S25_Camera_' + name, camera_group)
        protrusion = .0021 if r > .006 else .00172
        top = -.0041 - protrusion
        profile = [
            (r - .00035, -.00407), (r, -.00440),
            (r, top + .00027), (r - .00024, top),
            (r - .00142, top), (r - .0015, top + .00025),
            (r - .0015, -.00407),
        ]
        ring = lathe('S25_' + name + '_IndividualRing', x, z, profile,
                     ring_mat, group, 48, ring_edge, (2, 3))
        ring['estimated_dimensions'] = True
        ring['estimated_ring_diameter_mm'] = r * 2000
        disc('S25_' + name + '_CoverGlass', x, z, top + .000055,
             r - .00140, cover, group, segments=48)
        lathe('S25_' + name + '_OpticRim', x, z,
              [(pupil + .00028, top + .00004), (pupil + .00028, top + .00001),
               (pupil, top + .00001), (pupil, top + .00004)], ring_mat, group, 36)
        disc('S25_' + name + '_OpticalDepth', x, z, top + .000005,
             pupil, optics, group, segments=36)
        disc('S25_' + name + '_Aperture', x, z, top - .000004,
             pupil * .58, cover, group, segments=32)
        if name == 'Tele5x':
            plane_rr('S25_Tele5x_PeriscopeWindow', .00365, .0027, .00045,
                     top - .000008, black, group, center=(x, 0, z), front=False, steps=3)
        arc('S25_' + name + '_CoatingArc', x, z, top - .000012,
            pupil * .89, pupil * .89, .12 * math.pi, .69 * math.pi,
            .00019, reflection, group, steps=15)

    # Laser AF and flash are separate, comparatively shallow modules.
    lathe('S25_LaserAF_Bezel', -.0042, .0610,
          [(.00275, -.00408), (.00280, -.00455), (.00255, -.00470),
           (.00210, -.00470), (.00210, -.00408)], ring_mat, camera_group, 32)
    disc('S25_LaserAF_DarkWindow', -.0042, .0610, -.00469, .0021, cover, camera_group, segments=32)
    disc('S25_LaserAF_InnerSensor', -.0042, .0610, -.004705, .00103, optics, camera_group, segments=24)
    lathe('S25_FlashMetalSeat', -.0042, .0502,
          [(.0021, -.00408), (.0021, -.00432), (.00180, -.00432), (.00180, -.00408)],
          chamfer, camera_group, 32)
    disc('S25_FlashFrostedWindow', -.0042, .0502, -.00434, .0018, flash, camera_group, segments=32)
    disc('S25_FlashPhosphorCenter', -.0042, .0502, -.004345, .00072, flash_center, camera_group, segments=20)

    # The volume rocker and side key are on the handset's front-view right (-X).
    for name, z, height in [('VolumeRocker', .0355, .0120), ('SideKey', .0155, .0078)]:
        bed = rr('S25_' + name + '_Recess', .0030, height + .00065, .00075,
                 -.00010, .00010, black, control_group, center=(-.03878, 0, z), steps=4)
        bed.rotation_euler.z = math.pi / 2
        key = rr('S25_' + name, .0027, height, .00065, -.00010, .00048,
                 titanium, control_group, center=(-.03878, 0, z),
                 shoulder=.00008, edge_mat=chamfer, steps=5)
        key.rotation_euler.z = math.pi / 2

    for side in (-1, 1):
        for z in (-.0635, .0628):
            small_box('S25_SideAntennaBand', (side * .038805, 0, z),
                      (.000022, .00746, .00078), antenna, control_group)
    for z in (-.081405, .081405):
        for x in (-.0212, .0212):
            small_box('S25_EndAntennaBand', (x, 0, z), (.00078, .00742, .00002), antenna, control_group)

    def end_detail(name, x, y, z, width, height, radius, mat, top=False):
        obj = plane_rr(name, width, height, radius, 0, mat, control_group,
                       front=True, steps=5)
        obj.rotation_euler.x = math.pi / 2 if top else -math.pi / 2
        obj.location = (x, y, z)
        return obj

    # Bottom details use shallow surfaces, without heavy booleans or interiors.
    end_detail('S25_USB_C_MetalRim', 0, 0, -.081415, .0098, .00355, .00165, chamfer)
    end_detail('S25_USB_C_Recess', 0, 0, -.081425, .0090, .00290, .00140, black)
    end_detail('S25_USB_C_Tongue', 0, 0, -.08144, .00675, .00066, .00024, antenna)
    for i in range(6):
        end_detail('S25_USB_C_Contact', (i - 2.5) * .00070, -.00016, -.081447,
                   .00023, .00018, .000025, chamfer)
    end_detail('S25_SIM_TrayOutline', -.0211, 0, -.081416, .0143, .00320, .0010, black)
    end_detail('S25_SIM_TrayFace', -.0211, 0, -.081427, .0138, .00274, .00083, titanium)
    end_detail('S25_SIM_EjectHole', -.02615, 0, -.081434, .00085, .00085, .000425, black)
    end_detail('S25_BottomMicrophone', -.0082, 0, -.081425, .00082, .00082, .00041, black)
    for i in range(5):
        end_detail('S25_LowerSpeakerSlot', .0125 + i * .00235, 0, -.081425,
                   .0011, .0021, .0005, black)
    end_detail('S25_SeatedSPenSeal', .0322, 0, -.08142, .00520, .00378, .0017, black)
    end_detail('S25_SeatedSPenEndCap', .0322, 0, -.08144, .00455, .00316, .00140, titanium)
    end_detail('S25_SPenEndCapHighlight', .0322, -.00074, -.08145,
               .0028, .00022, .00010, chamfer)
    for x in (-.0110, .0110):
        end_detail('S25_TopMicrophone', x, 0, .081425, .00085, .00085, .000425, black, True)
    # Slim earpiece opening along the front/top seam, without invented grille bulk.
    end_detail('S25_UpperEarpieceSlit', 0, .00347, .081424, .018, .00040, .00018, black, True)

    # Small subdued manufacturer wordmark, with built-in font converted to mesh.
    # Geometry remains original and no vendor image/font texture is embedded.
    text_curve = bpy.data.curves.new('S25_WordmarkCurve', 'FONT')
    text_curve.body = 'SAMSUNG'
    text_curve.size = .0034
    text_curve.align_x = 'CENTER'
    text_curve.align_y = 'CENTER'
    text_curve.space_character = 1.12
    text_curve.resolution_u = 2
    text_curve.extrude = 0
    text_obj = bpy.data.objects.new('S25_RearWordmark', text_curve)
    scene.collection.objects.link(text_obj)
    text_obj.parent = back_group
    text_obj.location = (0, -.00414, -.053)
    text_obj.rotation_euler.x = math.pi / 2
    text_curve.materials.append(lettering)
    # Conversion through the data API does not alter selection or active object.
    if bpy.context.scene == scene:
        bpy.context.view_layer.update()
        evaluated = text_obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
        text_mesh = bpy.data.meshes.new_from_object(evaluated)
        converted = bpy.data.objects.new('S25_RearWordmarkMesh', text_mesh)
        scene.collection.objects.link(converted)
        converted.parent = back_group
        converted.location = text_obj.location.copy()
        converted.rotation_euler = text_obj.rotation_euler.copy()
        bpy.data.objects.remove(text_obj, do_unlink=True)
        converted.name = 'S25_RearWordmark'
        if text_curve.users == 0:
            bpy.data.curves.remove(text_curve)

    root['mesh_triangle_estimate'] = sum(
        max(0, len(poly.vertices) - 2)
        for obj in root.children_recursive if obj.type == 'MESH'
        for poly in obj.data.polygons
    )
    return root
