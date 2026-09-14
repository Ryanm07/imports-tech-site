"""Original Ulanzi U200 geometry, metres, for assembly by the calling script.

build_u200(scene) adds only the rig and returns its root Empty. It does not
create/reset a scene, add lights, animate, save, export, or require bpy.ops.
Subject and diffusers face -Y; the operator looks at the +Y rear. Main shell
bottom is Z=0. Dimensions and small details are provisional visual estimates.
"""

import math
import bpy


def _material(name, color, roughness=0.5, metallic=0.0, emission=None):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.diffuse_color = (*color, 1.0)
    shader = material.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1.0)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    if emission is not None:
        socket = shader.inputs.get('Emission Color') or shader.inputs.get('Emission')
        if socket is not None:
            socket.default_value = (*emission, 1.0)
        strength = shader.inputs.get('Emission Strength')
        if strength is not None:
            strength.default_value = 0.0
    return material


def _empty(scene, name, parent=None):
    obj = bpy.data.objects.new(name, None)
    scene.collection.objects.link(obj)
    obj.empty_display_type = 'PLAIN_AXES'
    obj.empty_display_size = 0.02
    obj.parent = parent
    return obj


def _mesh(scene, name, vertices, faces, material, parent, location=(0, 0, 0)):
    mesh = bpy.data.meshes.new(name + '_Mesh')
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    if material:
        mesh.materials.append(material)
    return obj


def _rounded_rect(width, height, radius, segments=5, cx=0, cz=0):
    """Counterclockwise outline in X,Z, with no repeated closing point."""
    radius = min(radius, width * 0.49, height * 0.49)
    points = []
    for x, z, start in ((width/2-radius, height/2-radius, 0),
                        (-width/2+radius, height/2-radius, 90),
                        (-width/2+radius, -height/2+radius, 180),
                        (width/2-radius, -height/2+radius, 270)):
        for index in range(segments + 1):
            angle = math.radians(start + index * 90 / segments)
            points.append((cx + x + radius*math.cos(angle),
                           cz + z + radius*math.sin(angle)))
    return points


def _plate(scene, name, outline, front_y, back_y, material, parent):
    """Closed plate extruded in Y; outline is counterclockwise in X,Z."""
    n = len(outline)
    vertices = [(x, front_y, z) for x, z in outline]
    vertices += [(x, back_y, z) for x, z in outline]
    faces = [tuple(range(n)), tuple(range(2*n-1, n-1, -1))]
    faces += [(i, n+i, n+(i+1) % n, (i+1) % n) for i in range(n)]
    return _mesh(scene, name, vertices, faces, material, parent)


def _panel(scene, name, center, width, height, depth, radius, material, parent):
    x, y, z = center
    return _plate(scene, name, _rounded_rect(width, height, radius, 4, x, z),
                  y-depth/2, y+depth/2, material, parent)


def _box(scene, name, center, size, material, parent, bevel=0.0):
    x, y, z = (v/2 for v in size)
    vertices = [(-x,-y,-z), (x,-y,-z), (x,y,-z), (-x,y,-z),
                (-x,-y,z), (x,-y,z), (x,y,z), (-x,y,z)]
    faces = [(3,2,1,0), (4,5,6,7), (0,1,5,4),
             (1,2,6,5), (2,3,7,6), (3,0,4,7)]
    obj = _mesh(scene, name, vertices, faces, material, parent, center)
    if bevel:
        modifier = obj.modifiers.new('U200_EdgeSoftening', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 2
        modifier.affect = 'EDGES'
    return obj


def _cylinder(scene, name, center, radius, depth, material, parent,
              axis='Z', sides=24, knurl=0.0):
    """Caps plus a shallow alternating-radius knurl; no texture dependency."""
    vertices = []
    for end in (-depth/2, depth/2):
        for i in range(sides):
            a = i * math.tau / sides
            r = radius - (knurl if i % 2 else 0)
            u, v = r*math.cos(a), r*math.sin(a)
            if axis == 'X':
                vertices.append((end, u, v))
            elif axis == 'Y':
                vertices.append((u, end, -v))
            else:
                vertices.append((u, v, end))
    faces = [tuple(range(sides-1, -1, -1)),
             tuple(range(sides, 2*sides))]
    faces += [(i, (i+1) % sides, sides+(i+1) % sides, sides+i)
              for i in range(sides)]
    return _mesh(scene, name, vertices, faces, material, parent, center)


def _annulus(scene, name, center, outer, inner, depth, material, parent,
             axis='Z', sides=24):
    vertices = []
    for end, radius in ((-depth/2, outer), (depth/2, outer),
                        (-depth/2, inner), (depth/2, inner)):
        for i in range(sides):
            a = i*math.tau/sides
            u, v = radius*math.cos(a), radius*math.sin(a)
            vertices.append((end,u,v) if axis == 'X' else
                            (u,end,-v) if axis == 'Y' else (u,v,end))
    faces = []
    for a, b in ((0,1), (1,3), (3,2), (2,0)):
        for i in range(sides):
            j = (i+1) % sides
            faces.append((a*sides+i, a*sides+j, b*sides+j, b*sides+i))
    return _mesh(scene, name, vertices, faces, material, parent, center)


def _frame(scene, name, outer, inner, depth, center_z, material, parent,
           outer_radius=0.018, inner_radius=0.012, bevel=0.0015):
    """Continuous frame with an open aperture and baked bevel contours."""
    ow, oh = outer
    iw, ih = inner
    rings = []
    for y, inset in ((-depth/2, bevel), (-depth/2+bevel, 0),
                     (depth/2-bevel, 0), (depth/2, bevel)):
        rings.append([(x,y,z) for x,z in _rounded_rect(
            ow-2*inset, oh-2*inset, outer_radius-inset, 5, cz=center_z)])
    for y, inset in ((-depth/2, bevel), (-depth/2+bevel, 0),
                     (depth/2-bevel, 0), (depth/2, bevel)):
        rings.append([(x,y,z) for x,z in _rounded_rect(
            iw+2*inset, ih+2*inset, inner_radius+inset, 5, cz=center_z)])
    n = len(rings[0])
    vertices = [vertex for ring in rings for vertex in ring]
    faces = []
    # The loop direction gives outward normals on exterior and aperture walls.
    for a,b in ((0,1), (1,2), (2,3), (3,7),
                (7,6), (6,5), (5,4), (4,0)):
        for i in range(n):
            j = (i+1) % n
            faces.append((a*n+i, b*n+i, b*n+j, a*n+j))
    return _mesh(scene, name, vertices, faces, material, parent)


def _rear_text(scene, name, body, location, size, material, parent):
    curve = bpy.data.curves.new(name + '_Font', 'FONT')
    curve.body = body
    curve.align_x = 'CENTER'
    curve.align_y = 'CENTER'
    curve.size = size
    curve.resolution_u = 2
    curve.extrude = 0.000025
    obj = bpy.data.objects.new(name, curve)
    scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    obj.rotation_euler = (math.pi/2, 0, math.pi)
    curve.materials.append(material)
    return obj


def build_u200(scene):
    """Build the provisional 290 x 220 x 31 mm rig at the supplied origin."""
    root = _empty(scene, 'UlanziU200')
    root['product'] = 'Ulanzi U200 Ring Light Video Rig / SKU 2245'
    root['model_origin'] = 'Original procedural geometry from visual references'
    root['width_m'] = 0.290
    root['height_m'] = 0.220
    root['depth_m'] = 0.031
    root['width_provisional'] = 0.290
    root['height_provisional'] = 0.220
    root['depth_provisional'] = 0.031
    root['dimensions_provisional'] = True
    root['dimension_note'] = 'Source disagreement 255 vs 290 mm width; verify unit'
    root['aperture_width_m'] = 0.220
    root['aperture_height_m'] = 0.130
    root['phone_center_z'] = 0.110
    root['phone_center'] = (0.0, 0.0, 0.110)
    root['phone_landscape_width_m'] = 0.1628
    root['phone_height_m'] = 0.0776
    root['phone_depth_m'] = 0.0082
    root['subject_direction'] = '-Y'
    root['operator_direction'] = '+Y'
    root['triangle_target'] = 15000
    root['small_details'] = 'Visual estimates, not manufacturing measurements'

    shell = _material('U200_Shell', (0.018,0.020,0.022), 0.43)
    edge = _material('U200_Edge', (0.032,0.035,0.038), 0.35)
    seam = _material('U200_Seam', (0.004,0.005,0.006), 0.72)
    rubber = _material('U200_Rubber', (0.014,0.016,0.017), 0.83)
    grip = _material('U200_GripRibs', (0.033,0.035,0.036), 0.77)
    metal = _material('U200_DarkMetal', (0.11,0.12,0.13), 0.30, 0.72)
    silver = _material('U200_ScrewSteel', (0.37,0.39,0.40), 0.28, 0.8)
    marking = _material('U200_Marking', (0.48,0.50,0.51), 0.70)
    label = _material('U200_Label', (0.06,0.065,0.069), 0.65)
    red = _material('U200_ClampPad', (0.26,0.024,0.028), 0.87)
    green = _material('U200_Indicator', (0.12,0.37,0.04), 0.36)
    diffuser = _material('U200_Diffuser', (0.86,0.85,0.81), 0.63,
                         emission=(1.0,0.89,0.73))
    shader = diffuser.node_tree.nodes.get('Principled BSDF')
    if shader.inputs.get('Subsurface Weight') is not None:
        shader.inputs['Subsurface Weight'].default_value = 0.025

    structure = _empty(scene, 'U200Housing', root)
    diffusers = _empty(scene, 'U200Diffusers', root)
    controls = _empty(scene, 'U200Controls', root)
    mountings = _empty(scene, 'U200MountingInterfaces', root)
    clamp = _empty(scene, 'U200PhoneClamp', root)
    clamp['jaw_width_m'] = 0.023
    clamp['phone_bottom_z'] = 0.0712
    clamp['phone_top_z'] = 0.1488

    _frame(scene, 'U200_ContinuousShell', (.290,.220), (.220,.130),
           .031,.110,shell,structure)
    # Thin continuous perimeter band visibly separates the rear cover.
    rear = _frame(scene, 'U200_RearCoverSeam', (.287,.217), (.223,.133),
                  .0005,.110,seam,structure, .017,.013, .0001)
    rear.location.y = .0149

    # Four independent broad diffusers, with dark diagonal corner breaks.
    top = [(-.104,.181), (.104,.181), (.124,.207), (.119,.213),
           (-.119,.213), (-.124,.207)]
    bottom = [(x,.220-z) for x,z in reversed(top)]
    right = [(.116,.057), (.138,.036), (.140,.043), (.140,.177),
             (.138,.184), (.116,.163)]
    left = [(-x,z) for x,z in reversed(right)]
    for name, outline in (('Top',top), ('Bottom',bottom),
                          ('Right',right), ('Left',left)):
        # A wider black gasket separates the lens plastic from the housing.
        cx = sum(x for x,z in outline)/len(outline)
        cz = sum(z for x,z in outline)/len(outline)
        gasket = [(cx+(x-cx)*1.035, cz+(z-cz)*1.035) for x,z in outline]
        _plate(scene, 'U200_DiffuserGasket_'+name, gasket,
               -.0161,-.0148,seam,structure)
        part = _plate(scene, 'U200_Diffuser_'+name, outline,
                      -.0164,-.0151,diffuser,diffusers)
        part['emission_control'] = 'U200_Diffuser / Principled BSDF / Emission Strength'

    # Rear top and bottom rubberized trapezoids echo the photographed shell.
    rear_top = [(-.103,.182), (.103,.182), (.124,.208), (.119,.213),
                (-.119,.213), (-.124,.208)]
    rear_bottom = [(x,.220-z) for x,z in reversed(rear_top)]
    for name, outline in (('Top',rear_top), ('Bottom',rear_bottom)):
        _plate(scene, 'U200_RearPadBorder_'+name, outline, .0156,.0165,edge,structure)
        cx = sum(x for x,z in outline)/len(outline)
        cz = sum(z for x,z in outline)/len(outline)
        inset = [(cx+(x-cx)*.965, cz+(z-cz)*.82) for x,z in outline]
        _plate(scene, 'U200_RearPad_'+name, inset, .0164,.0169,rubber,structure)

    for sign, side in ((-1,'Right'),(1,'Left')):
        x = sign*.1276
        _panel(scene,'U200_RearGrip_'+side,(x,.0166,.110),.022,.121,
               .0016,.006,rubber,structure)
        for i in range(17):
            rib = _box(scene,'U200_GripDiagonal_%s_%02d' % (side,i),
                       (x,.0178,.059+i*.0063),(.018,.0008,.00105),grip,structure)
            rib.rotation_euler.y = sign*math.radians(29)
        for z in (.043,.177):
            cap = _box(scene,'U200_GripCorner_'+side+str(z),
                       (sign*.128,.0162,z),(.020,.002,.025),edge,structure,.001)
            cap.rotation_euler.y = sign*(1 if z>.110 else -1)*math.radians(38)

    _rear_text(scene,'U200_ULANZI_Logo','ULANZI',(0,.0171,.197),.010,marking,structure)
    _panel(scene,'U200_RearSpecificationLabel',(0,.0171,.023),.067,.022,
           .0003,.001,label,structure)
    _rear_text(scene,'U200_LabelTitle','Ulanzi  U200',(0,.01735,.029),.0044,marking,structure)
    _rear_text(scene,'U200_LabelSpecs','20W   2500-8500K',(0,.01735,.023),.0031,marking,structure)
    _rear_text(scene,'U200_LabelModel','RING LIGHT VIDEO RIG',(0,.01735,.017),.0028,marking,structure)

    # Controls sit on operator-left outer edge (+X in this coordinate system).
    for i,z in enumerate((.149,.120)):
        _box(scene,'U200_WheelRecess_%d'%i,(.1448,0,z),(.0008,.012,.021),seam,controls,.001)
        _cylinder(scene,'U200_KnurledControlWheel_%d'%i,(.146,0,z),
                  .0087,.0038,edge,controls,'X',48,.0007)
        _cylinder(scene,'U200_WheelHub_%d'%i,(.1481,0,z),
                  .0047,.0005,rubber,controls,'X',20)
        _box(scene,'U200_WheelIndex_%d'%i,(.1485,0,z+.0058),
             (.0003,.0012,.0022),marking,controls)
    _cylinder(scene,'U200_PowerButtonBezel',(.1455,0,.096),.0044,.0018,
              metal,controls,'X',24)
    _cylinder(scene,'U200_PowerButton',(.1466,0,.096),.00335,.001,
              rubber,controls,'X',24)
    for i in range(4):
        _box(scene,'U200_BatteryIndicatorWell_%d'%i,(.145,0,.066+i*.003),
             (.0007,.0036,.0017),seam,controls)
        _box(scene,'U200_BatteryIndicator_%d'%i,(.1455,0,.066+i*.003),
             (.0005,.0028,.0012),green,controls)

    # USB openings use dark inset wells, thin rims, tongues and contacts.
    for name,z,width,height in (('USB_A',.135,.0133,.0064),
                                ('USB_C',.069,.0086,.0031)):
        _box(scene,'U200_'+name+'_OuterRecess',(-.1451,0,z),
             (.0005,width+.0024,height+.0022),seam,controls,.0004)
        for ysign in (-1,1):
            _box(scene,'U200_'+name+'_RimY'+str(ysign),
                 (-.14555,ysign*width/2,z),(.00065,.00055,height),metal,controls)
        for zsign in (-1,1):
            _box(scene,'U200_'+name+'_RimZ'+str(zsign),
                 (-.14555,0,z+zsign*height/2),(.00065,width,.0005),metal,controls)
        _box(scene,'U200_'+name+'_Tongue',(-.1459,0,z),
             (.0006,width*.70,.0012 if name=='USB_A' else .0007),rubber,controls)
        for i in range(4 if name=='USB_A' else 6):
            count = 4 if name=='USB_A' else 6
            _box(scene,'U200_'+name+'_Contact_%d'%i,
                 (-.14625,(i-(count-1)/2)*width*.075,z),
                 (.00015,.00055,.0003),silver,controls)

    # Three open cold shoes: the dark slot stays visibly open between rails.
    for i,x in enumerate((-.095,0,.095)):
        shoe = _empty(scene,'U200_ColdShoe_%d'%(i+1),mountings)
        shoe['type'] = 'Cold shoe, approximate geometry'
        _box(scene,'U200_ShoeBase_%d'%i,(x,0,.2205),(.024,.025,.0022),metal,shoe,.0005)
        _box(scene,'U200_ShoeSlot_%d'%i,(x,0,.2217),(.016,.021,.0007),seam,shoe)
        for sign in (-1,1):
            _box(scene,'U200_ShoeRail_%d_%d'%(i,sign),(x+sign*.010,0,.224),
                 (.003,.024,.005),metal,shoe,.00035)
            _box(scene,'U200_ShoeLip_%d_%d'%(i,sign),(x+sign*.0081,0,.226),
                 (.0048,.024,.0014),edge,shoe,.00025)
        _box(scene,'U200_ShoeStop_%d'%i,(x,.011,.2232),(.018,.002,.0033),metal,shoe)

    # Female 1/4-inch mounting sockets: annular insert and dark well.
    _annulus(scene,'U200_BottomQuarterThreadRim',(0,0,.00015),.0052,.00318,
             .0007,metal,mountings,'Z',24)
    _cylinder(scene,'U200_BottomQuarterThreadWell',(0,0,-.00025),.00305,.00015,
              seam,mountings,'Z',24)
    _annulus(scene,'U200_SideQuarterThreadRim',(-.1453,0,.106),.0052,.00318,
             .0007,metal,mountings,'X',24)
    _cylinder(scene,'U200_SideQuarterThreadWell',(-.1458,0,.106),.00305,.00015,
              seam,mountings,'X',24)
    for x in (-.127,.127):
        for z in (.024,.196):
            _cylinder(scene,'U200_RearScrew_%s_%s'%(x,z),(x,.0161,z),.0021,.0006,
                      metal,structure,'Y',16)
            _box(scene,'U200_RearScrewSlot_%s_%s'%(x,z),(x,.0165,z),
                 (.0025,.00015,.00045),seam,structure)

    # Independent narrow clamp, centred behind the phone body on subject side.
    # The upper/lower positive-Y lips only overlap the phone at its edge.
    _cylinder(scene,'U200_ClampBaseCollar',(0,0,.049),.014,.0078,
              edge,clamp,'Z',48,.0007)
    _cylinder(scene,'U200_ClampMountScrew',(0,0,.0548),.00318,.0048,
              silver,clamp,'Z',20)
    _box(scene,'U200_ClampSupportNeck',(0,-.001,.0618),
         (.020,.015,.0188),shell,clamp,.0012)
    _panel(scene,'U200_ClampBackRail',(0,-.0082,.110),.019,.082,
           .0036,.0025,shell,clamp)
    _panel(scene,'U200_ClampSlider',(0,-.0103,.134),.012,.035,
           .0014,.0012,edge,clamp)
    _box(scene,'U200_ClampLowerJaw',(0,0,.0689),(.023,.017,.0034),shell,clamp,.0007)
    _box(scene,'U200_ClampLowerContactPad',(0,0,.0709),(.021,.011,.0006),red,clamp)
    _box(scene,'U200_ClampUpperJaw',(0,0,.1511),(.023,.017,.0034),shell,clamp,.0007)
    _box(scene,'U200_ClampUpperContactPad',(0,0,.1491),(.021,.011,.0006),red,clamp)
    for name,z in (('Lower',.0722),('Upper',.1478)):
        for sign in (-1,1):
            _box(scene,'U200_Clamp%sRetainingLip_%d'%(name,sign),
                 (0,sign*.0063,z),(.023,.002,.003),rubber,clamp,.0004)
    for side,z in (('Lower',.07125),('Upper',.14875)):
        for i in range(9):
            _box(scene,'U200_ClampPadRib_%s_%d'%(side,i),
                 ((i-4)*.0022,0,z),(.0007,.009,.00013),red,clamp)
    _cylinder(scene,'U200_ClampRearAdjustment',(0,-.0134,.154),.0052,.004,
              edge,clamp,'Y',32,.0004)

    root['base_mesh_triangles'] = sum(
        sum(len(poly.vertices)-2 for poly in obj.data.polygons)
        for obj in root.children_recursive if obj.type == 'MESH')
    root['geometry_budget_note'] = 'Base count excludes bevel evaluation and font tessellation'
    return root
